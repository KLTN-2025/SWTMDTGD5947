<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Helper\Constants;
use App\Mail\AdminOrderPlacedMail;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

class CheckoutService 
{
    public function checkout($user, $request) 
    {
        $validationResult = $this->validateCheckoutData($request);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $cartResult = $this->validateUserCart($user);
        if (!$cartResult['isValid']) {
            return $cartResult['response'];
        }

        $orderResult = $this->createOrderFromCart($user, $cartResult['cart'], $validationResult['data']);
        if (!$orderResult['isCreated']) {
            return $orderResult['response'];
        }

        if (!empty($orderResult['order'])) {
            $this->notifyAdminsAboutOrder($orderResult['order']);
        }

        return $orderResult['response'];
    }

    private function validateCheckoutData($request) 
    {
        $validator = Validator::make($request->all(), [
            'deliveryAddress' => 'required|string|max:255',
            'paymentMethod' => 'nullable|in:CASH,CREDIT_CARD,E_WALLET,BANK_TRANSFER',
        ], [
            'deliveryAddress.required' => 'Địa chỉ giao hàng là bắt buộc',
            'deliveryAddress.max' => 'Địa chỉ giao hàng không được vượt quá 255 ký tự',
            'paymentMethod.in' => 'Phương thức thanh toán không hợp lệ',
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

        return [
            'isValid' => true,
            'data' => $validator->validated()
        ];
    }

    private function validateUserCart($user) 
    {
        try {
            $cart = Cart::where('userId', $user->id)->first();
            
            if (!$cart) {
                return [
                    'isValid' => false,
                    'response' => [
                        'code' => HttpCode::BAD_REQUEST,
                        'status' => false,
                        'msgCode' => MsgCode::VALIDATION_ERROR,
                        'message' => 'Giỏ hàng trống, không thể thanh toán'
                    ]
                ];
            }

            $cartItems = CartItem::where('cartId', $cart->id)
                ->with(['productVariant.product', 'productVariant.product.colors'])
                ->get();

            if ($cartItems->isEmpty()) {
                return [
                    'isValid' => false,
                    'response' => [
                        'code' => HttpCode::BAD_REQUEST,
                        'status' => false,
                        'msgCode' => MsgCode::VALIDATION_ERROR,
                        'message' => 'Giỏ hàng trống, không thể thanh toán'
                    ]
                ];
            }

            // Validate từng cart item
            $validationErrors = [];
            foreach ($cartItems as $item) {
                $variant = $item->productVariant;
                $product = $variant->product;

                // Kiểm tra sản phẩm còn tồn tại và chưa bị xóa
                if ($product->trashed()) {
                    $validationErrors[] = "Sản phẩm '{$product->name}' đã bị xóa";
                    continue;
                }

                // Kiểm tra trạng thái sản phẩm
                if ($product->status !== 'IN_STOCK') {
                    $validationErrors[] = "Sản phẩm '{$product->name}' hiện không có sẵn";
                    continue;
                }

                // Kiểm tra thời gian bán của variant
                $now = now();
                if ($variant->startDate && $now->lt($variant->startDate)) {
                    $validationErrors[] = "Sản phẩm '{$product->name}' chưa được bán";
                    continue;
                }

                if ($variant->endDate && $now->gt($variant->endDate)) {
                    $validationErrors[] = "Sản phẩm '{$product->name}' đã hết hạn bán";
                    continue;
                }

                // Kiểm tra số lượng (nếu có stock management)
                if (isset($product->quantity) && $product->quantity < $item->quantity) {
                    $validationErrors[] = "Sản phẩm '{$product->name}' chỉ còn {$product->quantity} sản phẩm";
                    continue;
                }
            }

            if (!empty($validationErrors)) {
                return [
                    'isValid' => false,
                    'response' => [
                        'code' => HttpCode::BAD_REQUEST,
                        'status' => false,
                        'msgCode' => MsgCode::VALIDATION_ERROR,
                        'message' => 'Có lỗi với sản phẩm trong giỏ hàng',
                        'errors' => $validationErrors
                    ]
                ];
            }

            $cart->items = $cartItems;
            return [
                'isValid' => true,
                'cart' => $cart
            ];

        } catch (Exception $e) {
            Log::error('Validate cart failed: ' . $e->getMessage());
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi kiểm tra giỏ hàng'
                ]
            ];
        }
    }

    private function createOrderFromCart($user, $cart, $checkoutData) 
    {
        try {
            return DB::transaction(function () use ($user, $cart, $checkoutData) {
                // Tính tổng tiền
                $totalAmount = $cart->items->sum(function ($item) {
                    return $item->quantity * $item->productVariant->price;
                });

                // Tạo order (mặc định COD nếu không có paymentMethod)
                $paymentMethod = $checkoutData['paymentMethod'] ?? 'CASH';
                
                $order = Order::create([
                    'userId' => $user->id,
                    'status' => Order::STATUS_PENDING,
                    'amount' => $totalAmount,
                    'deliveryAddress' => $checkoutData['deliveryAddress'],
                    'paymentMethod' => $paymentMethod,
                    'paymentStatus' => $paymentMethod === 'CASH' ? Order::PAYMENT_STATUS_UNPAID : Order::PAYMENT_STATUS_PENDING,
                ]);

                // Tạo order items từ cart items
                foreach ($cart->items as $cartItem) {
                    OrderItem::create([
                        'orderId' => $order->id,
                        'productVariantId' => $cartItem->productVariantId,
                        'colorId' => $cartItem->colorId,
                        'quantity' => $cartItem->quantity,
                        'amount' => $cartItem->quantity * $cartItem->productVariant->price,
                    ]);

                    // Giảm stock nếu có (optional)
                    if (isset($cartItem->productVariant->product->quantity)) {
                        $product = $cartItem->productVariant->product;
                        $product->quantity -= $cartItem->quantity;
                        
                        // Nếu số lượng về 0, cập nhật trạng thái thành hết hàng
                        if ($product->quantity <= 0) {
                            $product->quantity = 0; // Đảm bảo không âm
                            $product->status = Product::STATUS_SOLD_OUT;
                        }
                        
                        $product->save();
                    }
                }

                // Xóa cart items sau khi tạo order thành công
                CartItem::where('cartId', $cart->id)->delete();

                // Load order với relationships cho response
                $order->load([
                    'items.productVariant.product.images',
                    'items.productVariant.product.colors',
                    'items.productVariant.size',
                    'items.color',
                    'user'
                ]);

                return [
                    'isCreated' => true,
                    'order' => $order,
                    'response' => [
                        'code' => HttpCode::SUCCESS,
                        'status' => true,
                        'msgCode' => MsgCode::SUCCESS,
                        'message' => 'Đặt hàng thành công',
                        'data' => [
                            'order' => $order,
                            'nextStep' => $paymentMethod === 'CASH' ? 'order_confirmed' : 'payment_required'
                        ]
                    ]
                ];
            });

        } catch (Exception $e) {
            Log::error('Create order failed: ' . $e->getMessage());
            return [
                'isCreated' => false,
                'order' => null,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Đặt hàng thất bại'
                ]
            ];
        }
    }

    public function calculateCheckout($user) 
    {
        try {
            $cart = Cart::where('userId', $user->id)->first();
            
            if (!$cart) {
                return [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Giỏ hàng trống',
                    'data' => [
                        'subtotal' => 0,
                        'shipping' => 0,
                        'tax' => 0,
                        'total' => 0,
                        'items' => []
                    ]
                ];
            }

            $cartItems = CartItem::where('cartId', $cart->id)
                ->with(['productVariant.product', 'productVariant.product.colors', 'productVariant.size'])
                ->get();

            $subtotal = $cartItems->sum(function ($item) {
                return $item->quantity * $item->productVariant->price;
            });

            // Tính phí ship (có thể customize theo logic business)
            $shipping = $this->calculateShipping($subtotal);
            
            // Tính thuế (có thể customize)
            $tax = $this->calculateTax($subtotal);
            
            $total = $subtotal + $shipping + $tax;

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Tính toán checkout thành công',
                'data' => [
                    'subtotal' => $subtotal,
                    'shipping' => $shipping,
                    'tax' => $tax,
                    'total' => $total,
                    'items' => $cartItems,
                    'itemCount' => $cartItems->count(),
                    'totalQuantity' => $cartItems->sum('quantity')
                ]
            ];

        } catch (Exception $e) {
            Log::error('Calculate checkout failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Tính toán checkout thất bại'
            ];
        }
    }

    private function calculateShipping($subtotal) 
    {
        // Logic tính phí ship
        if ($subtotal >= 500000) { // Miễn phí ship cho đơn >= 500k
            return 0;
        }
        return 30000; // Phí ship cố định 30k
    }

    private function calculateTax($subtotal) 
    {
        // Logic tính thuế (VN thường không có VAT cho retail)
        return 0;
    }

    private function notifyAdminsAboutOrder(?Order $order): void
    {
        if (!$order) {
            return;
        }

        try {
            $adminRole = Role::where('name', Constants::ADMIN)->first();
            if (!$adminRole) {
                return;
            }

            $admins = User::where('roleId', $adminRole->id)
                ->where('isActive', true)
                ->whereNotNull('email')
                ->get();

            if ($admins->isEmpty()) {
                return;
            }

            foreach ($admins as $admin) {
                Mail::to($admin->email)->queue(new AdminOrderPlacedMail($order));
            }
        } catch (Exception $exception) {
            Log::error('Notify admins about new order failed: ' . $exception->getMessage());
        }
    }
}
