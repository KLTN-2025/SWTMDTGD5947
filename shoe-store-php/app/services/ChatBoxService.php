<?php

namespace App\services;

use App\Enums\ChatBoxMode;
use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Category;
use App\Models\ChatBoxMessage;
use App\Models\HistoriesChatBox;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ChatBoxService
{
    protected int $historyLimit = 8;
    protected ?string $openAiKey;
    protected string $openAiModel;

    public function __construct()
    {
        $this->openAiKey = env('OPENAI_API_KEY');
        $this->openAiModel = env('OPENAI_MODEL', 'gpt-3.5-turbo');
    }

    public function sendMessage($user, Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'mode' => ['required', Rule::in(ChatBoxMode::values())],
            'message' => 'required|string|min:3|max:2000',
            'chatBoxId' => [
                'nullable',
                Rule::exists('chat_box_messages', 'id')->where(function ($query) use ($user) {
                    return $query->where('userId', $user->id);
                }),
            ],
            'categoryId' => 'nullable|exists:categories,id',
            'preferences' => 'nullable|array',
            'preferences.categoryIds' => 'nullable|array',
            'preferences.categoryIds.*' => 'integer|exists:categories,id',
            'preferences.colors' => 'nullable|array',
            'preferences.colors.*' => 'string|max:60',
            'preferences.styleKeywords' => 'nullable|array',
            'preferences.styleKeywords.*' => 'string|max:60',
            'preferences.budgetMin' => 'nullable|numeric|min:0',
            'preferences.budgetMax' => 'nullable|numeric|min:0',
            'preferences.usage' => 'nullable|string|max:255',
            'preferences.gender' => 'nullable|string|max:30',
            'sizeInfo' => 'nullable|array',
            'sizeInfo.footLengthCm' => 'nullable|numeric|min:10|max:35',
            'sizeInfo.footWidthCm' => 'nullable|numeric|min:5|max:15',
            'sizeInfo.currentSize' => 'nullable|string|max:30',
            'sizeInfo.fitPreference' => 'nullable|string|max:50',
            'orderCode' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return [
                'code' => HttpCode::VALIDATION_ERROR,
                'status' => false,
                'msgCode' => MsgCode::VALIDATION_ERROR,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ];
        }

        if (!$this->openAiKey) {
            Log::warning('OPENAI_API_KEY missing for chat box service');
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Chưa cấu hình OPENAI_API_KEY cho chatbot',
            ];
        }

        $data = $validator->validated();
        $mode = $data['mode'];
        $rawMessage = trim($data['message']);
        $preferences = $data['preferences'] ?? [];
        $sizeInfo = $data['sizeInfo'] ?? [];
        $categoryId = $data['categoryId'] ?? $this->resolveCategoryFromPreferences($preferences);

        $chatBox = $this->resolveChatBox($user->id, $data['chatBoxId'] ?? null, $mode, $categoryId);

        $productContext = in_array($mode, [ChatBoxMode::AUTO_QA, ChatBoxMode::SHOE_ADVISOR], true)
            ? $this->fetchRelevantProducts($mode, $preferences, $rawMessage)
            : collect();

        $sizeInsights = $mode === ChatBoxMode::SIZE_SUPPORT
            ? $this->buildSizeInsights($user->id, $sizeInfo)
            : [];

        $orderContext = $mode === ChatBoxMode::ORDER_SUPPORT
            ? $this->buildOrderContext($user->id, $data['orderCode'] ?? null, $rawMessage)
            : [
                'orders' => [],
                'orderDetail' => null,
                'orderCode' => null,
            ];

        $systemMessages = $this->buildSystemMessages($mode, $productContext, $sizeInsights, $orderContext);
        $historyMessages = $this->buildHistoryMessages($chatBox);

        $renderedUserPrompt = $this->buildUserPrompt(
            $mode,
            $user->name ?? $user->userName ?? 'Khách hàng',
            $rawMessage,
            $preferences,
            $sizeInfo,
            $orderContext
        );

        $messages = array_merge(
            $systemMessages,
            $historyMessages,
            [['role' => 'user', 'content' => $renderedUserPrompt]]
        );

        $aiResponse = $this->callOpenAi($messages);

        if (!$aiResponse['success']) {
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => $aiResponse['error'],
            ];
        }

        $reply = $aiResponse['reply'];

        $this->storeHistory(
            $chatBox->id,
            'user',
            $mode,
            [
                'preferences' => $preferences,
                'sizeInfo' => $sizeInfo,
                'orderContext' => $orderContext,
                'renderedPrompt' => $renderedUserPrompt,
            ],
            $rawMessage
        );

        $assistantHistory = $this->storeHistory(
            $chatBox->id,
            'assistant',
            $mode,
            [
                'model' => $this->openAiModel,
                'productContextCount' => $productContext->count(),
                'orderSummaryCount' => count($orderContext['orders'] ?? []),
                'hasOrderDetail' => !empty($orderContext['orderDetail']),
            ],
            $reply
        );

        $chatBox->touch();

        $history = $this->formatHistoryResponse(
            $chatBox->histories()->orderBy('createdAt', 'asc')->limit(50)->get()
        );

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Trợ lý đã phản hồi',
            'data' => [
                'chatBoxId' => $chatBox->id,
                'mode' => $mode,
                'modeLabel' => ChatBoxMode::getLabel($mode),
                'reply' => $reply,
                'history' => $history,
                'suggestedProducts' => $productContext->take(6)->values(),
                'sizeInsights' => $sizeInsights,
                'ordersSummary' => $orderContext['orders'] ?? [],
                'orderDetail' => $orderContext['orderDetail'] ?? null,
                'detectedOrderCode' => $orderContext['orderCode'] ?? null,
                'assistantMessageId' => $assistantHistory->id ?? null,
            ],
        ];
    }

    public function getUserChatBoxes($user): array
    {
        $chatBoxes = ChatBoxMessage::with(['histories' => function ($query) {
            $query->orderBy('createdAt', 'desc')->limit(1);
        }])
            ->withCount('histories')
            ->where('userId', $user->id)
            ->orderBy('updatedAt', 'desc')
            ->get();

        $data = $chatBoxes->map(function ($chatBox) {
            $lastHistory = $chatBox->histories->first();
            return [
                'id' => $chatBox->id,
                'mode' => $chatBox->mode,
                'modeLabel' => ChatBoxMode::getLabel($chatBox->mode),
                'categoryId' => $chatBox->categoryId,
                'lastMessage' => $lastHistory->message ?? null,
                'lastMessageRole' => $this->extractRole($lastHistory->context ?? null),
                'totalMessages' => $chatBox->histories_count,
                'updatedAt' => optional($chatBox->updatedAt)->toDateTimeString(),
            ];
        })->values();

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Danh sách phiên chat',
            'data' => $data,
        ];
    }

    public function getChatBoxDetail($user, int $chatBoxId): array
    {
        $chatBox = ChatBoxMessage::where('userId', $user->id)
            ->where('id', $chatBoxId)
            ->first();

        if (!$chatBox) {
            return [
                'code' => HttpCode::NOT_FOUND,
                'status' => false,
                'msgCode' => MsgCode::NOT_FOUND,
                'message' => 'Không tìm thấy phiên chat',
            ];
        }

        $histories = $chatBox->histories()
            ->orderBy('createdAt', 'asc')
            ->limit(100)
            ->get();

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Chi tiết phiên chat',
            'data' => [
                'chatBoxId' => $chatBox->id,
                'mode' => $chatBox->mode,
                'modeLabel' => ChatBoxMode::getLabel($chatBox->mode),
                'categoryId' => $chatBox->categoryId,
                'history' => $this->formatHistoryResponse($histories),
            ],
        ];
    }

    protected function resolveChatBox(int $userId, ?int $chatBoxId, string $mode, ?int $categoryId): ChatBoxMessage
    {
        if ($chatBoxId) {
            $chatBox = ChatBoxMessage::where('userId', $userId)->find($chatBoxId);
            if ($chatBox) {
                if ($chatBox->mode !== $mode) {
                    $chatBox->mode = $mode;
                }
                if ($categoryId && $chatBox->categoryId !== $categoryId) {
                    $chatBox->categoryId = $categoryId;
                }
                $chatBox->save();
                return $chatBox;
            }
        }

        return ChatBoxMessage::create([
            'userId' => $userId,
            'categoryId' => $categoryId,
            'mode' => $mode,
        ]);
    }

    protected function resolveCategoryFromPreferences(array $preferences): ?int
    {
        $categoryIds = $preferences['categoryIds'] ?? [];
        if (is_array($categoryIds) && count($categoryIds)) {
            return (int) $categoryIds[0];
        }
        return null;
    }

    protected function fetchRelevantProducts(string $mode, array $preferences, string $rawMessage): Collection
    {
        $baseQuery = Product::with([
            'categories:id,name',
            'colors:id,name,hexCode',
            'variants.size:id,nameSize',
            'images:id,productId,url',
        ])
            ->withAvg('reviews as rating_avg', 'rating')
            ->whereNull('deletedAt')
            ->where('status', Product::STATUS_IN_STOCK);

        $categoryIds = $preferences['categoryIds'] ?? [];
        if (!empty($categoryIds)) {
            $baseQuery->whereHas('categories', function ($q) use ($categoryIds) {
                $q->whereIn('categories.id', $categoryIds);
            });
        }

        $colors = $preferences['colors'] ?? [];
        if (!empty($colors)) {
            $baseQuery->whereHas('colors', function ($q) use ($colors) {
                $q->whereIn('colors.name', $colors)
                    ->orWhereIn('colors.hexCode', $colors);
            });
        }

        $budgetMin = $preferences['budgetMin'] ?? null;
        $budgetMax = $preferences['budgetMax'] ?? null;
        if ($budgetMin !== null && $budgetMin !== '') {
            $baseQuery->where('basePrice', '>=', (float) $budgetMin);
        }
        if ($budgetMax !== null && $budgetMax !== '') {
            $baseQuery->where('basePrice', '<=', (float) $budgetMax);
        }

        $styleKeywords = $preferences['styleKeywords'] ?? [];
        if (!empty($styleKeywords)) {
            $baseQuery->where(function ($q) use ($styleKeywords) {
                foreach ($styleKeywords as $keyword) {
                    $q->orWhere('description', 'like', '%' . $keyword . '%')
                        ->orWhere('name', 'like', '%' . $keyword . '%');
                }
            });
        }

        $query = clone $baseQuery;

        $appliedKeywordFilter = false;
        $keywords = $this->extractSearchKeywords($rawMessage);

        if ($mode === ChatBoxMode::AUTO_QA && !empty($keywords)) {
            $appliedKeywordFilter = true;
            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->orWhere('name', 'like', '%' . $keyword . '%')
                        ->orWhere('description', 'like', '%' . $keyword . '%');
                }
            });
        }

        $limit = $mode === ChatBoxMode::AUTO_QA ? 5 : 8;

        $products = $query->orderBy('updatedAt', 'desc')
            ->limit($limit)
            ->get();

        if ($products->isEmpty() && $mode === ChatBoxMode::AUTO_QA && $appliedKeywordFilter) {
            $products = (clone $baseQuery)
                ->orderBy('updatedAt', 'desc')
                ->limit($limit)
                ->get();
        }

        return $products
            ->map(function ($product) {
                $categories = $product->categories->pluck('name')->unique()->values()->all();
                $colors = $product->colors->map(function ($color) {
                    return trim($color->name . ($color->hexCode ? ' (#' . $color->hexCode . ')' : ''));
                })->unique()->values()->all();
                $sizes = $product->variants->map(function ($variant) {
                    return $variant->size->nameSize ?? null;
                })->filter()->unique()->values()->all();

                $image = $product->images->first();

                return [
                    'skuId' => $product->skuId,
                    'name' => $product->name,
                    'price' => (float) $product->basePrice,
                    'rating' => $product->rating_avg ? round($product->rating_avg, 1) : null,
                    'categories' => $categories,
                    'colors' => $colors,
                    'sizes' => $sizes,
                    'mainImage' => $image?->fullUrl,
                    'description' => $product->description,
                ];
            });
    }

    protected function buildSizeInsights(int $userId, array $sizeInfo): array
    {
        return [
            'input' => [
                'footLengthCm' => $sizeInfo['footLengthCm'] ?? null,
                'footWidthCm' => $sizeInfo['footWidthCm'] ?? null,
                'currentSize' => $sizeInfo['currentSize'] ?? null,
                'fitPreference' => $sizeInfo['fitPreference'] ?? null,
            ],
            'history' => $this->fetchUserSizeHistory($userId),
            'sizeChart' => $this->sizeChart(),
            'bestPractices' => [
                'Đo chân vào cuối ngày để có kích thước chính xác.',
                'Nếu chiều dài nằm giữa hai size, ưu tiên size lớn hơn nếu thích rộng, nhỏ hơn nếu thích ôm.',
                'Đối với giày thể thao chạy bộ, cộng thêm 0.5cm để tránh chạm mũi.',
            ],
        ];
    }

    protected function fetchUserSizeHistory(int $userId): array
    {
        return OrderItem::whereHas('order', function ($q) use ($userId) {
            $q->where('userId', $userId)
                ->where('status', Order::STATUS_COMPLETED);
        })
            ->with([
                'productVariant.size:id,nameSize',
                'productVariant.product:id,name,skuId',
            ])
            ->orderBy('createdAt', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'orderId' => $item->orderId,
                    'productName' => $item->productVariant->product->name ?? null,
                    'skuId' => $item->productVariant->product->skuId ?? null,
                    'size' => $item->productVariant->size->nameSize ?? null,
                    'purchasedAt' => optional($item->createdAt)->toDateTimeString(),
                ];
            })
            ->filter(function ($item) {
                return !empty($item['size']);
            })
            ->values()
            ->toArray();
    }

    protected function sizeChart(): array
    {
        return [
            ['eu' => 36, 'cm' => 22.5],
            ['eu' => 37, 'cm' => 23.0],
            ['eu' => 38, 'cm' => 24.0],
            ['eu' => 39, 'cm' => 24.5],
            ['eu' => 40, 'cm' => 25.0],
            ['eu' => 41, 'cm' => 26.0],
            ['eu' => 42, 'cm' => 26.5],
            ['eu' => 43, 'cm' => 27.0],
            ['eu' => 44, 'cm' => 27.5],
            ['eu' => 45, 'cm' => 28.0],
        ];
    }

    protected function buildSystemMessages(string $mode, Collection $productContext, array $sizeInsights, array $orderContext = []): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => $this->baseSystemInstruction($mode),
            ],
        ];

        if ($productContext->isNotEmpty()) {
            $messages[] = [
                'role' => 'system',
                'content' => "Sản phẩm nổi bật hiện có:\n" . $this->formatProductContext($productContext),
            ];
        }

        if ($mode === ChatBoxMode::SIZE_SUPPORT) {
            $messages[] = [
                'role' => 'system',
                'content' => "Hướng dẫn size và lịch sử người dùng:\n" . $this->formatSizeContext($sizeInsights),
            ];
        }

        if ($mode === ChatBoxMode::ORDER_SUPPORT && $this->hasOrderContext($orderContext)) {
            $messages[] = [
                'role' => 'system',
                'content' => "Thông tin đơn hàng hiện tại:\n" . $this->formatOrderContext($orderContext),
            ];
        }

        return $messages;
    }

    protected function baseSystemInstruction(string $mode): string
    {
        // ---- GUARDRAILS CHUNG ----
        $guardRails =
            "Nguyên tắc tuyệt đối (bắt buộc tuân thủ 100%):\n" .
            "1) Chỉ trả lời dựa trên dữ liệu ShoeX được cung cấp trong phần 'messages' hoặc dữ liệu ngữ cảnh nội bộ của hệ thống. Nếu thông tin không có trong dữ liệu → phải nói rõ \"Hệ thống không có dữ liệu này\".\n" .
            "2) Không được sáng tạo, phỏng đoán, giả định hoặc bịa ra bất kỳ:\n" .
            "   - Sản phẩm, giá, size, màu sắc, tồn kho, chính sách,\n" .
            "   - Thuộc tính hoặc thông tin không xuất hiện trong dữ liệu.\n" .
            "3) Không được sử dụng tri thức bên ngoài ShoeX, kể cả tri thức ngành giày.\n" .
            "4) Khi dữ liệu thiếu, phải hỏi lại khách để bổ sung – không được tự suy luận.\n" .
            "5) Trả lời ngắn gọn, ưu tiên bullet, rõ ràng, thực dụng.\n" .
            "6) Mỗi câu trả lời phải kết thúc bằng một CTA phù hợp.\n" .
            "7) Nếu câu hỏi nằm ngoài phạm vi hoặc không đủ dữ liệu → trả lời đúng sự thật, không cố gắng giải thích thêm.\n";

        // ---- KHUNG GỐC ----
        $base =
            "Bạn là trợ lý bán hàng ShoeX. Trả lời bằng tiếng Việt, thân thiện, súc tích, không lan man. " .
            "Mọi câu trả lời phải dựa trên dữ liệu ShoeX được cung cấp. {$guardRails}";

        // ---- MODE TÙY THEO CHỨC NĂNG ----
        switch ($mode) {

            // === MODE: TƯ VẤN CHỌN GIÀY ===
            case ChatBoxMode::SHOE_ADVISOR:
                return $base . "\n\n" .
                    "Chế độ: Tư vấn chọn giày.\n" .
                    "- Gợi ý sản phẩm chỉ dựa trên danh sách sản phẩm được cung cấp.\n" .
                    "- Nếu người dùng đưa tiêu chí (giá, phong cách, mục đích, màu,…), chỉ lọc trong dữ liệu có.\n" .
                    "- Nếu không tìm được sản phẩm phù hợp → phải nói rõ và gợi ý điều chỉnh tiêu chí.\n" .
                    "- Mỗi gợi ý phải gồm: tên, giá, màu/size còn hàng (nếu có trong data), lý do phù hợp.\n" .
                    "- Tối đa 3 sản phẩm.\n" .
                    "- Kết thúc bằng CTA: \"Bạn muốn xem chi tiết sản phẩm nào không?\".\n";

            // === MODE: HỖ TRỢ SIZE ===
            case ChatBoxMode::SIZE_SUPPORT:
                return $base . "\n\n" .
                    "Chế độ: Hỗ trợ chọn size.\n" .
                    "- Chỉ dùng dữ liệu đo chân, size đã mua, lịch sử trả hàng hoặc size khách đang dùng nếu có.\n" .
                    "- Không được dùng bảng size ngoài dữ liệu ShoeX hoặc tự suy ra size.\n" .
                    "- Nếu thông tin chưa đủ → phải yêu cầu người dùng cung cấp (chiều dài chân, kiểu chân, mẫu đang chọn,…).\n" .
                    "- Khi tư vấn size, phải đưa ra lý do rõ ràng dựa trên dữ liệu cụ thể.\n" .
                    "- CTA: \"Bạn gửi mình chiều dài chân (cm) để mình tính size chuẩn nhé?\".\n";

            // === MODE: HỖ TRỢ ĐƠN HÀNG ===
            case ChatBoxMode::ORDER_SUPPORT:
                return $base . "\n\n" .
                    "Chế độ: Hỗ trợ đơn hàng.\n" .
                    "- Luôn kiểm tra danh sách đơn của khách (tối đa 5 đơn gần nhất) và chi tiết đơn theo mã hệ thống nếu có.\n" .
                    "- Nếu khách hỏi chung chung, hãy tóm tắt các đơn gần nhất với mã đơn, trạng thái, ngày tạo, tổng tiền.\n" .
                    "- Nếu khách cung cấp mã đơn, ưu tiên diễn giải chi tiết đơn đó (sản phẩm, size, màu, số lượng, trạng thái thanh toán, địa chỉ giao hàng).\n" .
                    "- Khi không tìm thấy đơn, phải nêu rõ \"Hệ thống chưa có đơn phù hợp\" và gợi ý khách kiểm tra lại mã hoặc liên hệ CSKH.\n" .
                    "- CTA mẫu: \"Bạn muốn mình cập nhật trạng thái mới nhất của đơn #ID không?\".\n";

                // === MODE: HỎI ĐÁP CHUNG ===
            default:
                return $base . "\n\n" .
                    "Chế độ: Hỗ trợ hỏi đáp chung.\n" .
                    "- Trả lời chính xác dựa trên dữ liệu ShoeX (sản phẩm, đơn hàng, tồn kho, size, chính sách hệ thống cung cấp).\n" .
                    "- Nếu câu hỏi nằm ngoài hệ thống hoặc dữ liệu thiếu → phải nêu rõ \"Hệ thống chưa có dữ liệu này\".\n" .
                    "- Không được tự tạo thông tin.\n" .
                    "- CTA phù hợp cuối câu.\n";
        }
    }



    protected function formatProductContext(Collection $productContext): string
    {
        return $productContext->map(function ($product) {
            $categories = empty($product['categories']) ? '' : ' | Danh mục: ' . implode(', ', $product['categories']);
            $colors = empty($product['colors']) ? '' : ' | Màu: ' . implode(', ', $product['colors']);
            $sizes = empty($product['sizes']) ? '' : ' | Size: ' . implode(', ', $product['sizes']);
            $rating = $product['rating'] ? ' | Rating: ' . $product['rating'] . '/5' : '';
            return "- {$product['name']} (SKU {$product['skuId']}) | Giá: " . number_format($product['price']) . " VND{$categories}{$colors}{$sizes}{$rating}";
        })->implode("\n");
    }

    protected function formatSizeContext(array $sizeInsights): string
    {
        $lines = [];

        if (!empty($sizeInsights['input'])) {
            $inputs = array_filter($sizeInsights['input'], function ($value) {
                return $value !== null && $value !== '';
            });
            if (!empty($inputs)) {
                $lines[] = 'Thông tin khách cung cấp: ' . json_encode($inputs, JSON_UNESCAPED_UNICODE);
            }
        }

        if (!empty($sizeInsights['history'])) {
            $historySummaries = array_map(function ($item) {
                return "{$item['productName']} (SKU {$item['skuId']}), size {$item['size']}";
            }, $sizeInsights['history']);
            $lines[] = 'Lịch sử size đã mua: ' . implode('; ', $historySummaries);
        }

        $chartLines = array_map(function ($row) {
            return "EU {$row['eu']} ≈ {$row['cm']}cm";
        }, $sizeInsights['sizeChart'] ?? []);

        if (!empty($chartLines)) {
            $lines[] = 'Bảng quy đổi chuẩn: ' . implode(' | ', $chartLines);
        }

        return implode("\n", $lines);
    }

    protected function buildUserPrompt(
        string $mode,
        string $customerName,
        string $rawMessage,
        array $preferences,
        array $sizeInfo,
        array $orderContext = []
    ): string {
        $prompt = "Tên khách: {$customerName}\n";
        $prompt .= "Tin nhắn khách: {$rawMessage}\n";

        if ($mode === ChatBoxMode::SHOE_ADVISOR) {
            $prompt .= "Thông tin tư vấn: \n";
            if (!empty($preferences['categoryIds'])) {
                $categories = Category::whereIn('id', $preferences['categoryIds'])->pluck('name')->toArray();
                if (!empty($categories)) {
                    $prompt .= "- Danh mục ưu tiên: " . implode(', ', $categories) . "\n";
                }
            }
            if (!empty($preferences['usage'])) {
                $prompt .= "- Nhu cầu sử dụng: {$preferences['usage']}\n";
            }
            if (!empty($preferences['styleKeywords'])) {
                $prompt .= "- Phong cách/mood: " . implode(', ', $preferences['styleKeywords']) . "\n";
            }
            if (!empty($preferences['colors'])) {
                $prompt .= "- Màu/hoạ tiết thích: " . implode(', ', $preferences['colors']) . "\n";
            }
            if (!empty($preferences['budgetMin']) || !empty($preferences['budgetMax'])) {
                $prompt .= "- Ngân sách: từ " . number_format($preferences['budgetMin'] ?? 0)
                    . " đến " . number_format($preferences['budgetMax'] ?? 0) . " VND\n";
            }
        } elseif ($mode === ChatBoxMode::SIZE_SUPPORT) {
            $prompt .= "Thông số chọn size:\n";
            foreach (['footLengthCm' => 'Chiều dài', 'footWidthCm' => 'Chiều rộng', 'currentSize' => 'Size đang mang', 'fitPreference' => 'Sở thích ôm/rộng'] as $key => $label) {
                if (!empty($sizeInfo[$key])) {
                    $prompt .= "- {$label}: {$sizeInfo[$key]}\n";
                }
            }
        } elseif ($mode === ChatBoxMode::ORDER_SUPPORT) {
            $prompt .= "Ngữ cảnh đơn hàng:\n";
            if (!empty($orderContext['orderDetail'])) {
                $detail = $orderContext['orderDetail'];
                $prompt .= "- Đơn chi tiết: #{$detail['orderId']} | Trạng thái {$detail['status']} | Thanh toán {$detail['paymentStatus']} | Tổng "
                    . number_format($detail['amount']) . " VND\n";
                if (!empty($detail['items'])) {
                    $prompt .= "- Sản phẩm trong đơn:\n";
                    foreach ($detail['items'] as $item) {
                        $prompt .= "  • {$item['productName']} (SKU {$item['skuId']}), size {$item['size']}, màu {$item['color']}, SL {$item['quantity']}\n";
                    }
                }
            } elseif (!empty($orderContext['orders'])) {
                $prompt .= "- Danh sách đơn gần nhất:\n";
                foreach ($orderContext['orders'] as $orderSummary) {
                    $prompt .= "  • #{$orderSummary['orderId']} | {$orderSummary['status']} | "
                        . number_format($orderSummary['amount']) . " VND | {$orderSummary['createdAt']}\n";
                }
            } else {
                $prompt .= "- Không có đơn hàng nào trong hệ thống cho khách này.\n";
            }
            if (!empty($orderContext['orderCode'])) {
                $prompt .= "- Mã đơn khách đề cập / phát hiện: {$orderContext['orderCode']}\n";
            }
        }

        return $prompt;
    }

    protected function buildHistoryMessages(ChatBoxMessage $chatBox): array
    {
        return $chatBox->histories()
            ->orderBy('createdAt', 'desc')
            ->limit($this->historyLimit)
            ->get()
            ->reverse()
            ->map(function ($history) {
                $role = $this->extractRole($history->context);
                return [
                    'role' => $role,
                    'content' => $history->message ?? '',
                ];
            })
            ->toArray();
    }

    protected function extractRole(?string $context): string
    {
        if (!$context) {
            return 'user';
        }
        $decoded = json_decode($context, true);
        $role = $decoded['role'] ?? 'user';
        return in_array($role, ['assistant', 'user', 'system']) ? $role : 'user';
    }

    protected function callOpenAi(array $messages): array
    {
        try {
            $response = Http::timeout(45)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->openAiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->openAiModel,
                    'temperature' => 0.35,
                    'top_p' => 0.9,
                    'max_tokens' => config('services.openai.max_tokens', 700),
                    'messages' => $messages,
                ]);

            if ($response->failed()) {
                $errorMessage = $response->json('error.message') ?? 'OpenAI API trả về lỗi';
                Log::error('OpenAI chat completion failed', [
                    'error' => $errorMessage,
                    'status' => $response->status(),
                ]);
                return [
                    'success' => false,
                    'error' => $errorMessage,
                ];
            }

            $reply = trim($response->json('choices.0.message.content', ''));

            return [
                'success' => true,
                'reply' => $reply,
            ];
        } catch (Exception $exception) {
            Log::error('OpenAI chat completion exception', [
                'message' => $exception->getMessage(),
            ]);
            return [
                'success' => false,
                'error' => 'Không thể xử lý yêu cầu chatbot ngay lúc này',
            ];
        }
    }

    protected function storeHistory(int $chatBoxId, string $role, string $mode, array $meta, string $message)
    {
        return HistoriesChatBox::create([
            'chatBoxId' => $chatBoxId,
            'context' => json_encode([
                'role' => $role,
                'mode' => $mode,
                'meta' => $meta,
            ], JSON_UNESCAPED_UNICODE),
            'message' => $message,
        ]);
    }

    protected function formatHistoryResponse(Collection $histories): array
    {
        return $histories->map(function ($history) {
            return [
                'id' => $history->id,
                'role' => $this->extractRole($history->context),
                'message' => $history->message,
                'meta' => json_decode($history->context, true),
                'createdAt' => optional($history->createdAt)->toDateTimeString(),
            ];
        })->toArray();
    }

    protected function buildOrderContext(int $userId, ?string $orderCodeInput, string $rawMessage): array
    {
        $detectedCode = $orderCodeInput ?: $this->extractOrderCodeFromText($rawMessage);
        $numericOrderCode = ($detectedCode !== null && is_numeric($detectedCode))
            ? (int) $detectedCode
            : null;

        $orders = Order::where('userId', $userId)
            ->orderBy('createdAt', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($order) {
                return [
                    'orderId' => $order->id,
                    'status' => $order->status,
                    'paymentStatus' => $order->paymentStatus,
                    'amount' => (float) $order->amount,
                    'createdAt' => optional($order->createdAt)->toDateTimeString(),
                ];
            })
            ->toArray();

        $orderDetail = null;
        if ($numericOrderCode) {
            $order = Order::where('userId', $userId)
                ->where('id', $numericOrderCode)
                ->with([
                    'items.productVariant.product:id,name,skuId',
                    'items.productVariant.size:id,nameSize',
                    'items.color:id,name,hexCode',
                ])
                ->first();

            if ($order) {
                $orderDetail = [
                    'orderId' => $order->id,
                    'status' => $order->status,
                    'paymentStatus' => $order->paymentStatus,
                    'amount' => (float) $order->amount,
                    'paymentMethod' => $order->paymentMethod,
                    'deliveryAddress' => $order->deliveryAddress,
                    'createdAt' => optional($order->createdAt)->toDateTimeString(),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'productName' => $item->productVariant->product->name ?? null,
                            'skuId' => $item->productVariant->product->skuId ?? null,
                            'size' => $item->productVariant->size->nameSize ?? null,
                            'color' => $item->color->name ?? null,
                            'quantity' => (int) $item->quantity,
                            'amount' => (float) $item->amount,
                        ];
                    })->values()->toArray(),
                ];
            }
        }

        return [
            'orders' => $orders,
            'orderDetail' => $orderDetail,
            'orderCode' => $detectedCode,
        ];
    }

    protected function hasOrderContext(array $orderContext): bool
    {
        return !empty($orderContext['orders'])
            || !empty($orderContext['orderDetail'])
            || !empty($orderContext['orderCode']);
    }

    protected function formatOrderContext(array $orderContext): string
    {
        $lines = [];
        $orders = $orderContext['orders'] ?? [];
        $orderDetail = $orderContext['orderDetail'] ?? null;

        if (!empty($orders)) {
            $lines[] = 'Danh sách đơn gần nhất:';
            foreach ($orders as $order) {
                $lines[] = sprintf(
                    "- #%s | %s | %s | %s VND",
                    $order['orderId'],
                    $order['status'],
                    $order['createdAt'],
                    number_format($order['amount'])
                );
            }
        }

        if ($orderDetail) {
            $lines[] = 'Đơn chi tiết:';
            $lines[] = sprintf(
                "- #%s | %s | Thanh toán %s | %s VND | Giao: %s",
                $orderDetail['orderId'],
                $orderDetail['status'],
                $orderDetail['paymentStatus'],
                number_format($orderDetail['amount']),
                $orderDetail['deliveryAddress'] ?? 'N/A'
            );
            if (!empty($orderDetail['items'])) {
                foreach ($orderDetail['items'] as $item) {
                    $lines[] = sprintf(
                        "  • %s (SKU %s) | Size %s | Màu %s | SL %s",
                        $item['productName'] ?? 'Sản phẩm',
                        $item['skuId'] ?? 'N/A',
                        $item['size'] ?? 'N/A',
                        $item['color'] ?? 'N/A',
                        $item['quantity']
                    );
                }
            }
        }

        if (empty($lines)) {
            $lines[] = 'Không có dữ liệu đơn hàng trong hệ thống.';
        }

        return implode("\n", $lines);
    }

    protected function extractOrderCodeFromText(?string $rawMessage): ?string
    {
        if (!$rawMessage) {
            return null;
        }

        if (preg_match('/(\d{3,})/', $rawMessage, $matches)) {
            return $matches[1];
        }

        return null;
    }

    protected function extractSearchKeywords(?string $rawMessage): array
    {
        if (!$rawMessage) {
            return [];
        }

        $normalized = mb_strtolower($rawMessage, 'UTF-8');
        $normalized = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $normalized);
        $tokens = preg_split('/\s+/', $normalized, -1, PREG_SPLIT_NO_EMPTY);

        if (!$tokens) {
            return [];
        }

        $stopWords = [
            'hiện', 'hien', 'tại', 'tai', 'đang', 'dang', 'có', 'co',
            'những', 'nhung', 'loại', 'loai', 'nào', 'nao', 'giày', 'giay',
            'shop', 'cửa', 'cua', 'hàng', 'hang', 'này', 'nay', 'kia',
            'gì', 'gi', 'mình', 'minh', 'bạn', 'ban', 'xin', 'cho',
            'giúp', 'giup', 'hãy', 'hay', 'muốn', 'muon', 'cần', 'can',
            'các', 'cac', 'sản', 'san', 'phẩm', 'pham', 'bao', 'nhiêu', 'nhieu',
            'loại', 'loai', 'mấy', 'may', 'tất', 'tat'
        ];

        $keywords = [];
        foreach ($tokens as $token) {
            if (mb_strlen($token, 'UTF-8') < 3) {
                continue;
            }
            if (in_array($token, $stopWords, true)) {
                continue;
            }
            $keywords[] = $token;
        }

        return array_slice(array_unique($keywords), 0, 5);
    }
}
