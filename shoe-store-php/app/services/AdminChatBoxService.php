<?php

namespace App\services;

use App\Enums\ChatBoxMode;
use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\ChatBoxMessage;
use App\Models\HistoriesChatBox;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminChatBoxService
{
    public function listConversations(Request $request): array
    {
        try {
            $search = $request->input('search');
            $mode = $request->input('mode');
            $perPage = (int) $request->input('per_page', 15);
            $perPage = max(5, min($perPage, 50));

            $query = ChatBoxMessage::with([
                'user:id,name,email,userName,imageUrl,fullImageUrl,isActive',
                'histories' => function ($historyQuery) {
                    $historyQuery->orderBy('createdAt', 'desc')->limit(1);
                },
                'category:id,name',
            ])->withCount('histories');

            if ($mode) {
                $query->where('mode', $mode);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('userName', 'like', "%{$search}%");
                    })->orWhereHas('histories', function ($historyQuery) use ($search) {
                        $historyQuery->where('message', 'like', "%{$search}%");
                    });
                });
            }

            $paginator = $query->orderBy('updatedAt', 'desc')->paginate($perPage);

            $chatBoxes = $paginator->getCollection()->map(function ($chatBox) {
                $lastHistory = $chatBox->histories->first();
                $lastRole = $lastHistory ? $this->extractRole($lastHistory->context) : null;

                return [
                    'id' => $chatBox->id,
                    'mode' => $chatBox->mode,
                    'modeLabel' => ChatBoxMode::getLabel($chatBox->mode),
                    'category' => $chatBox->category ? [
                        'id' => $chatBox->category->id,
                        'name' => $chatBox->category->name,
                    ] : null,
                    'user' => $chatBox->user ? [
                        'id' => $chatBox->user->id,
                        'name' => $chatBox->user->name,
                        'email' => $chatBox->user->email,
                        'avatar' => $chatBox->user->fullImageUrl ?? $chatBox->user->imageUrl,
                        'isActive' => (bool) $chatBox->user->isActive,
                    ] : null,
                    'totalMessages' => $chatBox->histories_count,
                    'lastMessage' => $lastHistory->message ?? null,
                    'lastMessageRole' => $lastRole,
                    'lastMessageAt' => optional($lastHistory->createdAt)->toDateTimeString(),
                    'createdAt' => optional($chatBox->createdAt)->toDateTimeString(),
                    'updatedAt' => optional($chatBox->updatedAt)->toDateTimeString(),
                ];
            })->values();

            $modeBreakdownRaw = ChatBoxMessage::select('mode', DB::raw('COUNT(*) as total'))
                ->groupBy('mode')
                ->pluck('total', 'mode');

            $modeBreakdown = [];
            foreach (ChatBoxMode::values() as $modeValue) {
                $modeBreakdown[] = [
                    'mode' => $modeValue,
                    'label' => ChatBoxMode::getLabel($modeValue),
                    'count' => (int) ($modeBreakdownRaw[$modeValue] ?? 0),
                ];
            }

            $stats = [
                'totalConversations' => ChatBoxMessage::count(),
                'activeConversations' => ChatBoxMessage::where('updatedAt', '>=', now()->subDay())->count(),
                'totalMessages' => HistoriesChatBox::count(),
                'modeBreakdown' => $modeBreakdown,
                'availableModes' => ChatBoxMode::labels(),
            ];

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Danh sách cuộc trò chuyện',
                'data' => [
                    'chatBoxes' => $chatBoxes,
                    'pagination' => [
                        'total' => $paginator->total(),
                        'per_page' => $paginator->perPage(),
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                    'stats' => $stats,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('List admin chat conversations failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Không thể tải danh sách cuộc trò chuyện',
            ];
        }
    }

    public function getConversationDetail(int $chatBoxId): array
    {
        try {
            $chatBox = ChatBoxMessage::with([
                'user:id,name,email,userName,imageUrl,fullImageUrl,isActive',
                'user.profile:id,userId,phoneNumber,address',
                'histories' => function ($historyQuery) {
                    $historyQuery->orderBy('createdAt', 'asc');
                },
                'category:id,name',
            ])->find($chatBoxId);

            if (!$chatBox) {
                return [
                    'code' => HttpCode::NOT_FOUND,
                    'status' => false,
                    'msgCode' => MsgCode::NOT_FOUND,
                    'message' => 'Không tìm thấy cuộc trò chuyện',
                ];
            }

            $history = $chatBox->histories->map(function ($history) {
                return [
                    'id' => $history->id,
                    'role' => $this->extractRole($history->context),
                    'message' => $history->message,
                    'meta' => json_decode($history->context, true),
                    'createdAt' => optional($history->createdAt)->toDateTimeString(),
                ];
            });

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Chi tiết cuộc trò chuyện',
                'data' => [
                    'chatBox' => [
                        'id' => $chatBox->id,
                        'mode' => $chatBox->mode,
                        'modeLabel' => ChatBoxMode::getLabel($chatBox->mode),
                        'category' => $chatBox->category ? [
                            'id' => $chatBox->category->id,
                            'name' => $chatBox->category->name,
                        ] : null,
                        'user' => $chatBox->user ? [
                            'id' => $chatBox->user->id,
                            'name' => $chatBox->user->name,
                            'email' => $chatBox->user->email,
                            'avatar' => $chatBox->user->fullImageUrl ?? $chatBox->user->imageUrl,
                            'isActive' => (bool) $chatBox->user->isActive,
                            'phoneNumber' => optional($chatBox->user->profile)->phoneNumber,
                            'address' => optional($chatBox->user->profile)->address,
                        ] : null,
                        'createdAt' => optional($chatBox->createdAt)->toDateTimeString(),
                        'updatedAt' => optional($chatBox->updatedAt)->toDateTimeString(),
                    ],
                    'history' => $history,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get admin chat conversation detail failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Không thể tải chi tiết cuộc trò chuyện',
            ];
        }
    }

    public function deleteConversation(int $chatBoxId): array
    {
        try {
            $chatBox = ChatBoxMessage::find($chatBoxId);

            if (!$chatBox) {
                return [
                    'code' => HttpCode::NOT_FOUND,
                    'status' => false,
                    'msgCode' => MsgCode::NOT_FOUND,
                    'message' => 'Không tìm thấy cuộc trò chuyện',
                ];
            }

            DB::transaction(function () use ($chatBox) {
                $chatBox->histories()->delete();
                $chatBox->delete();
            });

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Đã xoá cuộc trò chuyện',
            ];
        } catch (Exception $exception) {
            Log::error('Delete admin chat conversation failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Không thể xoá cuộc trò chuyện',
            ];
        }
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
}

