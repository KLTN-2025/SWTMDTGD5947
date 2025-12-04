<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

class OrderService 
{
    public function getUserOrders($user, $request) 
    {
        try {
            $perPage = $request->input('per_page', 15);
            $status = $request->input('status');

            $query = Order::where('userId', $user->id)
                ->with([
                    'items.productVariant.product.images', 
                    'items.productVariant.product.colors', 
                    'items.productVariant.size',
                    'items.color'
                ])
                ->orderBy('createdAt', 'desc');

            // Filter by status if provided
            if ($status && in_array($status, ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'])) {
                $query->where('status', $status);
            }

            $orders = $query->paginate($perPage);

            // Thêm thông tin tính toán cho từng order
            $orders->getCollection()->each(function ($order) {
                $order->itemCount = $order->items->count();
                $order->totalQuantity = $order->items->sum('quantity');
                
                // Thêm status display
                $order->statusDisplay = $this->getStatusDisplay($order->status);
                $order->paymentStatusDisplay = $this->getPaymentStatusDisplay($order->paymentStatus);
                
                // Thêm thông tin có thể hủy đơn không
                $order->canCancel = in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_CONFIRMED]);
                
                // Thêm main image cho từng item
                $order->items->each(function ($item) {
                    $item->mainImage = $item->productVariant->product->images->first()?->fullUrl ?? null;
                });
            });

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách đơn hàng thành công',
                'data' => [
                    'orders' => $orders->items(),
                    'pagination' => [
                        'total' => $orders->total(),
                        'per_page' => $orders->perPage(),
                        'current_page' => $orders->currentPage(),
                        'last_page' => $orders->lastPage(),
                        'from' => $orders->firstItem(),
                        'to' => $orders->lastItem(),
                    ]
                ]
            ];

        } catch (Exception $e) {
            Log::error('Get user orders failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách đơn hàng thất bại'
            ];
        }
    }

    public function getOrderDetail($user, $orderId) 
    {
        $validationResult = $this->validateOrderId($orderId);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $orderResult = $this->findUserOrder($user, $orderId);
        if (!$orderResult['isFound']) {
            return $orderResult['response'];
        }

        $order = $orderResult['order'];
        
        // Thêm thông tin chi tiết
        $order->itemCount = $order->items->count();
        $order->totalQuantity = $order->items->sum('quantity');
        $order->statusDisplay = $this->getStatusDisplay($order->status);
        $order->paymentStatusDisplay = $this->getPaymentStatusDisplay($order->paymentStatus);
        $order->canCancel = in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_CONFIRMED]);
        
        // Thêm thông tin retry payment
        $order->canRetryPayment = $order->canRetryPayment();
        $order->remainingPaymentMinutes = $order->canRetryPayment() ? $order->getRemainingPaymentTimeInMinutes() : 0;
        
        // Thêm timeline status
        $order->statusTimeline = $this->getStatusTimeline($order);
        
        // Thêm thông tin chi tiết cho items
        $order->items->each(function ($item) {
            $item->mainImage = $item->productVariant->product->images->first()?->fullUrl ?? null;
            $item->itemTotal = $item->quantity * $item->amount / $item->quantity; // amount là total của item
        });

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Lấy chi tiết đơn hàng thành công',
            'data' => [
                'order' => $order
            ]
        ];
    }

    public function cancelOrder($user, $orderId) 
    {
        $validationResult = $this->validateOrderId($orderId);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $orderResult = $this->findUserOrder($user, $orderId);
        if (!$orderResult['isFound']) {
            return $orderResult['response'];
        }

        $order = $orderResult['order'];

        // Kiểm tra có thể hủy đơn không
        if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_CONFIRMED])) {
            return [
                'code' => HttpCode::BAD_REQUEST,
                'status' => false,
                'msgCode' => MsgCode::VALIDATION_ERROR,
                'message' => 'Không thể hủy đơn hàng ở trạng thái hiện tại'
            ];
        }

        $cancelResult = $this->performCancelOrder($order);
        if (!$cancelResult['isCancelled']) {
            return $cancelResult['response'];
        }

        return $cancelResult['response'];
    }

    private function validateOrderId($orderId) 
    {
        $validator = Validator::make(['id' => $orderId], [
            'id' => 'required|integer|min:1',
        ], [
            'id.required' => 'ID đơn hàng là bắt buộc',
            'id.integer' => 'ID đơn hàng phải là số nguyên',
            'id.min' => 'ID đơn hàng không hợp lệ',
        ]);

        if ($validator->fails()) {
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::VALIDATION_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => $validator->errors(),
                ]
            ];
        }

        return ['isValid' => true];
    }

    private function findUserOrder($user, $orderId) 
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('userId', $user->id)
                ->with([
                    'items.productVariant.product.images',
                    'items.productVariant.product.colors',
                    'items.productVariant.size',
                    'items.color',
                    'payment'
                ])
                ->first();

            if (!$order) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Không tìm thấy đơn hàng'
                    ]
                ];
            }

            return [
                'isFound' => true,
                'order' => $order
            ];

        } catch (Exception $e) {
            Log::error('Find user order failed: ' . $e->getMessage());
            return [
                'isFound' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi tìm đơn hàng'
                ]
            ];
        }
    }

    private function performCancelOrder($order) 
    {
        try {
            return DB::transaction(function () use ($order) {
                // Cập nhật trạng thái đơn hàng
                $order->status = Order::STATUS_CANCELLED;
                $order->paymentStatus = Order::PAYMENT_STATUS_CANCELLED;
                $order->save();

                // Hoàn lại stock nếu có
                foreach ($order->items as $item) {
                    $product = $item->productVariant->product;
                    if (isset($product->quantity)) {
                        $wasOutOfStock = $product->status === Product::STATUS_SOLD_OUT;
                        $product->quantity += $item->quantity;
                        
                        // Nếu trước đó hết hàng và giờ có stock, cập nhật về IN_STOCK
                        if ($wasOutOfStock && $product->quantity > 0) {
                            $product->status = Product::STATUS_IN_STOCK;
                        }
                        
                        $product->save();
                    }
                }

                // Load lại order với relationships
                $order->load([
                    'items.productVariant.product.images',
                    'items.productVariant.product.colors',
                    'items.productVariant.size'
                ]);

                return [
                    'isCancelled' => true,
                    'response' => [
                        'code' => HttpCode::SUCCESS,
                        'status' => true,
                        'msgCode' => MsgCode::SUCCESS,
                        'message' => 'Hủy đơn hàng thành công',
                        'data' => [
                            'order' => $order
                        ]
                    ]
                ];
            });

        } catch (Exception $e) {
            Log::error('Cancel order failed: ' . $e->getMessage());
            return [
                'isCancelled' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Hủy đơn hàng thất bại'
                ]
            ];
        }
    }

    private function getStatusDisplay($status) 
    {
        $statusMap = [
            Order::STATUS_PENDING => 'Chờ xác nhận',
            Order::STATUS_CONFIRMED => 'Đã xác nhận',
            Order::STATUS_SHIPPED => 'Đang giao hàng',
            Order::STATUS_COMPLETED => 'Hoàn thành',
            Order::STATUS_CANCELLED => 'Đã hủy',
        ];

        return $statusMap[$status] ?? $status;
    }

    private function getPaymentStatusDisplay($paymentStatus) 
    {
        $statusMap = [
            Order::PAYMENT_STATUS_PENDING => 'Chờ thanh toán',
            Order::PAYMENT_STATUS_UNPAID => 'Chưa thanh toán',
            Order::PAYMENT_STATUS_PAID => 'Đã thanh toán',
            Order::PAYMENT_STATUS_CANCELLED => 'Đã hủy',
            Order::PAYMENT_STATUS_REFUNDED => 'Đã hoàn tiền',
            Order::PAYMENT_STATUS_FAILED => 'Thanh toán thất bại',
        ];

        return $statusMap[$paymentStatus] ?? $paymentStatus;
    }

    private function getStatusTimeline($order) 
    {
        $timeline = [
            [
                'status' => 'PENDING',
                'label' => 'Đặt hàng',
                'completed' => true,
                'date' => $order->createdAt
            ]
        ];

        if ($order->status !== Order::STATUS_CANCELLED) {
            $timeline[] = [
                'status' => 'CONFIRMED',
                'label' => 'Xác nhận',
                'completed' => in_array($order->status, [Order::STATUS_CONFIRMED, Order::STATUS_SHIPPED, Order::STATUS_COMPLETED]),
                'date' => in_array($order->status, [Order::STATUS_CONFIRMED, Order::STATUS_SHIPPED, Order::STATUS_COMPLETED]) ? $order->updatedAt : null
            ];

            $timeline[] = [
                'status' => 'SHIPPED',
                'label' => 'Đang giao',
                'completed' => in_array($order->status, [Order::STATUS_SHIPPED, Order::STATUS_COMPLETED]),
                'date' => in_array($order->status, [Order::STATUS_SHIPPED, Order::STATUS_COMPLETED]) ? $order->updatedAt : null
            ];

            $timeline[] = [
                'status' => 'COMPLETED',
                'label' => 'Hoàn thành',
                'completed' => $order->status === Order::STATUS_COMPLETED,
                'date' => $order->status === Order::STATUS_COMPLETED ? $order->updatedAt : null
            ];
        } else {
            $timeline[] = [
                'status' => 'CANCELLED',
                'label' => 'Đã hủy',
                'completed' => true,
                'date' => $order->updatedAt
            ];
        }

        return $timeline;
    }
}
