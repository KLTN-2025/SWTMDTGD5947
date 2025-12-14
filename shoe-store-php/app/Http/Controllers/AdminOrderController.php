<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AdminOrderController extends Controller
{
    /**
     * GET /api/admin/orders - Danh sách đơn hàng với filter
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'nullable|in:PENDING,CONFIRMED,SHIPPED,COMPLETED,CANCELLED',
                'payment_status' => 'nullable|in:PENDING,UNPAID,PAID,CANCELLED,REFUNDED,FAILED',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'search' => 'nullable|string|max:255',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort_by' => 'nullable|in:id,amount,createdAt,status',
                'sort_order' => 'nullable|in:asc,desc'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'code' => 400,
                    'status' => false,
                    'msgCode' => 'VALIDATION_ERROR',
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $query = Order::with([
                'user:id,name,email,imageUrl', 
                'user.profile:userId,phoneNumber,address',
                'items.productVariant.product', 
                'items.productVariant.product.colors',
                'items.productVariant.size',
                'items.color'
            ]);

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter by payment status
            if ($request->filled('payment_status')) {
                $query->where('paymentStatus', $request->payment_status);
            }

            // Filter by date range
            if ($request->filled('date_from')) {
                $query->whereDate('createdAt', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('createdAt', '<=', $request->date_to);
            }

            // Search by order ID, customer name, email, phone
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%")
                                   ->orWhere('phone', 'like', "%{$search}%");
                      });
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'createdAt');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $orders = $query->paginate($perPage);

            // Transform data
            $transformedOrders = $orders->getCollection()->map(function ($order) {
                return [
                    'id' => $order->id,
                    'customer' => [
                        'id' => $order->user->id,
                        'name' => $order->user->name,
                        'email' => $order->user->email,
                        'avatar' => $order->user->imageUrl ? url($order->user->imageUrl) : null,
                        'phone' => $order->user->profile->phoneNumber ?? null,
                        'address' => $order->user->profile->address ?? null,
                    ],
                    'status' => $order->status,
                    'statusDisplay' => $this->getStatusDisplay($order->status),
                    'paymentStatus' => $order->paymentStatus,
                    'paymentStatusDisplay' => $this->getPaymentStatusDisplay($order->paymentStatus),
                    'paymentMethod' => $order->paymentMethod,
                    'paymentMethodDisplay' => $this->getPaymentMethodDisplay($order->paymentMethod),
                    'amount' => $order->amount,
                    'deliveryAddress' => $order->deliveryAddress,
                    'itemsCount' => $order->items->count(),
                    'createdAt' => $order->createdAt,
                    'updatedAt' => $order->updatedAt,
                    'canCancel' => in_array($order->status, ['PENDING', 'CONFIRMED']),
                    'canConfirm' => $order->status === 'PENDING',
                    'canShip' => $order->status === 'CONFIRMED',
                    'canComplete' => $order->status === 'SHIPPED',
                ];
            });

            return response()->json([
                'code' => 200,
                'status' => true,
                'msgCode' => 'SUCCESS',
                'message' => 'Lấy danh sách đơn hàng thành công',
                'data' => [
                    'orders' => $transformedOrders,
                    'pagination' => [
                        'total' => $orders->total(),
                        'per_page' => $orders->perPage(),
                        'current_page' => $orders->currentPage(),
                        'last_page' => $orders->lastPage(),
                        'from' => $orders->firstItem(),
                        'to' => $orders->lastItem(),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Admin get orders error: ' . $e->getMessage());
            return response()->json([
                'code' => 500,
                'status' => false,
                'msgCode' => 'SERVER_ERROR',
                'message' => 'Lỗi server khi lấy danh sách đơn hàng'
            ], 500);
        }
    }

    /**
     * GET /api/admin/orders/{id} - Chi tiết đơn hàng
     */
    public function show($id): JsonResponse
    {
        try {
            $order = Order::with([
                'user:id,name,email,imageUrl',
                'user.profile:userId,phoneNumber,address',
                'items.productVariant.product:id,name,skuId,basePrice',
                'items.productVariant.product.colors:id,name,hexCode',
                'items.productVariant.size:id,nameSize',
                'items.productVariant.product.images:id,productId,url',
                'items.color:id,name,hexCode'
            ])->find($id);

            if (!$order) {
                return response()->json([
                    'code' => 404,
                    'status' => false,
                    'msgCode' => 'ORDER_NOT_FOUND',
                    'message' => 'Không tìm thấy đơn hàng'
                ], 404);
            }

            // Transform order items
            $items = $order->items->map(function ($item) {
                $product = $item->productVariant->product;
                $mainImage = $product?->images?->first() ?? null;
                
                return [
                    'id' => $item?->id,
                    'quantity' => $item->quantity,
                    'itemTotal' => $item->quantity * $item->productVariant->price,
                    'mainImage' => $mainImage ? url($mainImage->url) : null,
                    'colorId' => $item->colorId,
                    'color' => $item->color ? [
                        'id' => $item->color?->id,
                        'name' => $item->color->name,
                        'hexCode' => $item->color->hexCode,
                    ] : null,
                    'productVariant' => [
                        'id' => $item->productVariant?->id,
                        'price' => $item->productVariant->price,
                        'product' => [
                            'id' => $product?->id,
                            'name' => $product?->name,
                            'skuId' => $product?->skuId,
                            'basePrice' => $product?->basePrice,
                            'colors' => $product?->colors->map(function ($color) {
                                return [
                                    'id' => $color?->id,
                                    'name' => $color?->name,
                                    'hexCode' => $color?->hexCode,
                                ];
                            }),
                        ],
                        'size' => [
                            'id' => $item->productVariant->size?->id,
                            'nameSize' => $item->productVariant->size->nameSize,
                        ]
                    ]
                ];
            });

            $transformedOrder = [
                'id' => $order?->id,
                'customer' => [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                    'avatar' => $order->user->imageUrl ? url($order->user->imageUrl) : null,
                    'phone' => $order->user->profile->phoneNumber ?? null,
                    'address' => $order->user->profile->address ?? null,
                ],
                'status' => $order->status,
                'statusDisplay' => $this->getStatusDisplay($order->status),
                'paymentStatus' => $order->paymentStatus,
                'paymentStatusDisplay' => $this->getPaymentStatusDisplay($order->paymentStatus),
                'paymentMethod' => $order->paymentMethod,
                'paymentMethodDisplay' => $this->getPaymentMethodDisplay($order->paymentMethod),
                'amount' => $order->amount,
                'deliveryAddress' => $order->deliveryAddress,
                'items' => $items,
                'createdAt' => $order->createdAt,
                'updatedAt' => $order->updatedAt,
                'canCancel' => in_array($order->status, ['PENDING', 'CONFIRMED']),
                'canConfirm' => $order->status === 'PENDING',
                'canShip' => $order->status === 'CONFIRMED',
                'canComplete' => $order->status === 'SHIPPED',
                'statusTimeline' => $this->getStatusTimeline($order),
            ];

            return response()->json([
                'code' => 200,
                'status' => true,
                'msgCode' => 'SUCCESS',
                'message' => 'Lấy chi tiết đơn hàng thành công',
                'data' => $transformedOrder
            ]);

        } catch (\Exception $e) {
            Log::error('Admin get order detail error: ' . $e->getMessage());
            return response()->json([
                'code' => 500,
                'status' => false,
                'msgCode' => 'SERVER_ERROR',
                'message' => 'Lỗi server khi lấy chi tiết đơn hàng'
            ], 500);
        }
    }

    /**
     * PUT /api/admin/orders/{id}/status - Cập nhật trạng thái đơn hàng
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:CONFIRMED,SHIPPED,COMPLETED',
                'note' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'code' => 400,
                    'status' => false,
                    'msgCode' => 'VALIDATION_ERROR',
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $order = Order::find($id);
            if (!$order) {
                return response()->json([
                    'code' => 404,
                    'status' => false,
                    'msgCode' => 'ORDER_NOT_FOUND',
                    'message' => 'Không tìm thấy đơn hàng'
                ], 404);
            }

            $newStatus = $request->status;
            $oldStatus = $order->status;

            // Debug log
            Log::info("Status transition attempt", [
                'orderId' => $id,
                'oldStatus' => $oldStatus,
                'newStatus' => $newStatus,
                'requestData' => $request->all()
            ]);

            // Check if trying to set same status
            if ($oldStatus === $newStatus) {
                return response()->json([
                    'code' => 400,
                    'status' => false,
                    'msgCode' => 'SAME_STATUS',
                    'message' => "Đơn hàng đã ở trạng thái {$oldStatus}. Vui lòng refresh trang để cập nhật trạng thái mới nhất."
                ], 400);
            }

            // Validate status transition
            $validTransitions = [
                'PENDING' => ['CONFIRMED'],
                'CONFIRMED' => ['SHIPPED'],
                'SHIPPED' => ['COMPLETED'],
            ];

            if (!isset($validTransitions[$oldStatus]) || !in_array($newStatus, $validTransitions[$oldStatus])) {
                return response()->json([
                    'code' => 400,
                    'status' => false,
                    'msgCode' => 'INVALID_STATUS_TRANSITION',
                    'message' => "Không thể chuyển từ trạng thái {$oldStatus} sang {$newStatus}. Trạng thái hợp lệ tiếp theo: " . implode(', ', $validTransitions[$oldStatus] ?? [])
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Update order status
                $order->status = $newStatus;
                
                // Cập nhật payment status khi hoàn thành đơn hàng
                if ($newStatus === 'COMPLETED') {
                    $order->paymentStatus = 'PAID';
                }
                
                $order->save();

                // Log status change
                $adminId = auth('sanctum')->id() ?? null;
                $this->logStatusChange($order->id, $oldStatus, $newStatus, $adminId, $request->note);

                DB::commit();

                return response()->json([
                    'code' => 200,
                    'status' => true,
                    'msgCode' => 'SUCCESS',
                    'message' => "Cập nhật trạng thái đơn hàng thành công: {$this->getStatusDisplay($newStatus)}",
                    'data' => [
                        'orderId' => $order->id,
                        'oldStatus' => $oldStatus,
                        'newStatus' => $newStatus,
                        'statusDisplay' => $this->getStatusDisplay($newStatus),
                        'paymentStatus' => $order->paymentStatus,
                        'paymentStatusDisplay' => $this->getPaymentStatusDisplay($order->paymentStatus)
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Admin update order status error: ' . $e->getMessage());
            return response()->json([
                'code' => 500,
                'status' => false,
                'msgCode' => 'SERVER_ERROR',
                'message' => 'Lỗi server khi cập nhật trạng thái đơn hàng'
            ], 500);
        }
    }

    /**
     * POST /api/admin/orders/{id}/cancel - Hủy đơn hàng
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:255',
                'note' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'code' => 400,
                    'status' => false,
                    'msgCode' => 'VALIDATION_ERROR',
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 400);
            }

            $order = Order::find($id);
            if (!$order) {
                return response()->json([
                    'code' => 404,
                    'status' => false,
                    'msgCode' => 'ORDER_NOT_FOUND',
                    'message' => 'Không tìm thấy đơn hàng'
                ], 404);
            }

            // Check if order can be cancelled
            if (!in_array($order->status, ['PENDING', 'CONFIRMED'])) {
                return response()->json([
                    'code' => 400,
                    'status' => false,
                    'msgCode' => 'CANNOT_CANCEL_ORDER',
                    'message' => 'Không thể hủy đơn hàng ở trạng thái hiện tại'
                ], 400);
            }

            DB::beginTransaction();

            try {
                $oldStatus = $order->status;
                
                // Update order status to cancelled
                $order->status = 'CANCELLED';
                $order->paymentStatus = 'CANCELLED';
                $order->save();

                // Log cancellation
                $adminId = auth('sanctum')->id() ?? null;
                $this->logStatusChange($order->id, $oldStatus, 'CANCELLED', $adminId, 
                    "Hủy bởi admin. Lý do: {$request->reason}. Ghi chú: {$request->note}");

                DB::commit();

                return response()->json([
                    'code' => 200,
                    'status' => true,
                    'msgCode' => 'SUCCESS',
                    'message' => 'Hủy đơn hàng thành công',
                    'data' => [
                        'orderId' => $order->id,
                        'oldStatus' => $oldStatus,
                        'newStatus' => 'CANCELLED',
                        'paymentStatus' => $order->paymentStatus,
                        'paymentStatusDisplay' => $this->getPaymentStatusDisplay($order->paymentStatus),
                        'reason' => $request->reason,
                        'note' => $request->note
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Admin cancel order error: ' . $e->getMessage());
            return response()->json([
                'code' => 500,
                'status' => false,
                'msgCode' => 'SERVER_ERROR',
                'message' => 'Lỗi server khi hủy đơn hàng'
            ], 500);
        }
    }

    /**
     * Helper methods
     */
    private function getStatusDisplay($status): string
    {
        $statusMap = [
            'PENDING' => 'Chờ xử lý',
            'CONFIRMED' => 'Đã xác nhận',
            'SHIPPED' => 'Đang giao hàng',
            'COMPLETED' => 'Hoàn thành',
            'CANCELLED' => 'Đã hủy'
        ];

        return $statusMap[$status] ?? $status;
    }

    private function getPaymentStatusDisplay($status): string
    {
        $statusMap = [
            'PENDING' => 'Chờ thanh toán',
            'UNPAID' => 'Chưa thanh toán',
            'PAID' => 'Đã thanh toán',
            'CANCELLED' => 'Đã hủy',
            'REFUNDED' => 'Đã hoàn tiền',
            'FAILED' => 'Thanh toán thất bại'
        ];

        return $statusMap[$status] ?? $status;
    }

    private function getPaymentMethodDisplay($method): string
    {
        $methodMap = [
            'CASH' => 'Thanh toán khi nhận hàng',
            'CREDIT_CARD' => 'Thẻ tín dụng',
            'E_WALLET' => 'Ví điện tử',
            'BANK_TRANSFER' => 'Chuyển khoản ngân hàng'
        ];

        return $methodMap[$method] ?? $method;
    }

    private function getStatusTimeline($order): array
    {
        $timeline = [
            ['label' => 'Đặt hàng', 'completed' => true, 'date' => $order->createdAt],
            ['label' => 'Xác nhận', 'completed' => in_array($order->status, ['CONFIRMED', 'SHIPPED', 'COMPLETED'])],
            ['label' => 'Đang giao', 'completed' => in_array($order->status, ['SHIPPED', 'COMPLETED'])],
            ['label' => 'Hoàn thành', 'completed' => $order->status === 'COMPLETED'],
        ];

        if ($order->status === 'CANCELLED') {
            $timeline = [
                ['label' => 'Đặt hàng', 'completed' => true, 'date' => $order->createdAt],
                ['label' => 'Đã hủy', 'completed' => true, 'date' => $order->updatedAt],
            ];
        }

        return $timeline;
    }

    /**
     * Log status change to order_status_logs table
     */
    private function logStatusChange($orderId, $oldStatus, $newStatus, $changedBy, $note = null): void
    {
        OrderStatusLog::create([
            'orderId' => $orderId,
            'oldStatus' => $oldStatus,
            'newStatus' => $newStatus,
            'changedBy' => $changedBy,
            'note' => $note
        ]);
    }
}
