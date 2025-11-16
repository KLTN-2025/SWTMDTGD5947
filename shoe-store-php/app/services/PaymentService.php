<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

class PaymentService 
{
    public function processPayment($user, $request) 
    {
        $validationResult = $this->validatePaymentData($request);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $orderResult = $this->findUserOrder($user, $validationResult['data']['orderId']);
        if (!$orderResult['isFound']) {
            return $orderResult['response'];
        }

        $order = $orderResult['order'];

        // Kiểm tra order có thể thanh toán không
        $checkResult = $this->validateOrderForPayment($order);
        if (!$checkResult['isValid']) {
            return $checkResult['response'];
        }

        // Xử lý thanh toán theo phương thức
        $paymentResult = $this->handlePaymentMethod($order, $validationResult['data']);
        if (!$paymentResult['isProcessed']) {
            return $paymentResult['response'];
        }

        return $paymentResult['response'];
    }

    public function confirmPayment($request) 
    {
        $validationResult = $this->validatePaymentConfirmation($request);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $paymentResult = $this->findPayment($validationResult['data']['transactionCode']);
        if (!$paymentResult['isFound']) {
            return $paymentResult['response'];
        }

        $confirmResult = $this->performPaymentConfirmation($paymentResult['payment'], $validationResult['data']);
        if (!$confirmResult['isConfirmed']) {
            return $confirmResult['response'];
        }

        return $confirmResult['response'];
    }

    private function validatePaymentData($request) 
    {
        $validator = Validator::make($request->all(), [
            'orderId' => 'required|integer|min:1',
            'paymentMethod' => 'required|in:CASH,CREDIT_CARD,E_WALLET,BANK_TRANSFER',
            'bankCode' => 'nullable|string|max:100',
            'accountNumber' => 'nullable|string|max:100',
        ], [
            'orderId.required' => 'ID đơn hàng là bắt buộc',
            'orderId.integer' => 'ID đơn hàng phải là số nguyên',
            'paymentMethod.required' => 'Phương thức thanh toán là bắt buộc',
            'paymentMethod.in' => 'Phương thức thanh toán không hợp lệ',
            'bankCode.max' => 'Mã ngân hàng không được vượt quá 100 ký tự',
            'accountNumber.max' => 'Số tài khoản không được vượt quá 100 ký tự',
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

    private function validatePaymentConfirmation($request) 
    {
        $validator = Validator::make($request->all(), [
            'transactionCode' => 'required|string|max:100',
            'status' => 'required|in:PAID,FAILED,CANCELLED',
            'amount' => 'nullable|numeric|min:0',
        ], [
            'transactionCode.required' => 'Mã giao dịch là bắt buộc',
            'status.required' => 'Trạng thái thanh toán là bắt buộc',
            'status.in' => 'Trạng thái thanh toán không hợp lệ',
            'amount.numeric' => 'Số tiền phải là số',
            'amount.min' => 'Số tiền không hợp lệ',
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

    private function findUserOrder($user, $orderId) 
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('userId', $user->id)
                ->with(['items', 'payment'])
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
            Log::error('Find user order for payment failed: ' . $e->getMessage());
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

    private function findPayment($transactionCode) 
    {
        try {
            $payment = Payment::where('transactionCode', $transactionCode)
                ->with(['order'])
                ->first();

            if (!$payment) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Không tìm thấy giao dịch thanh toán'
                    ]
                ];
            }

            return [
                'isFound' => true,
                'payment' => $payment
            ];

        } catch (Exception $e) {
            Log::error('Find payment failed: ' . $e->getMessage());
            return [
                'isFound' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi tìm giao dịch'
                ]
            ];
        }
    }

    private function validateOrderForPayment($order) 
    {
        // Kiểm tra trạng thái đơn hàng
        if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_CONFIRMED])) {
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => 'Đơn hàng không thể thanh toán ở trạng thái hiện tại'
                ]
            ];
        }

        // Kiểm tra trạng thái thanh toán
        if ($order->paymentStatus === Order::PAYMENT_STATUS_PAID) {
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => 'Đơn hàng đã được thanh toán'
                ]
            ];
        }

        if ($order->paymentStatus === Order::PAYMENT_STATUS_CANCELLED) {
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => 'Đơn hàng đã bị hủy'
                ]
            ];
        }

        return ['isValid' => true];
    }

    private function handlePaymentMethod($order, $paymentData) 
    {
        try {
            return DB::transaction(function () use ($order, $paymentData) {
                $transactionCode = $this->generateTransactionCode();

                // Tạo payment record
                $payment = Payment::create([
                    'orderId' => $order->id,
                    'status' => Payment::STATUS_PENDING,
                    'amount' => $order->amount,
                    'transactionCode' => $transactionCode,
                    'accountNumber' => $paymentData['accountNumber'] ?? null,
                    'bankCode' => $paymentData['bankCode'] ?? null,
                ]);

                $response = [];

                switch ($paymentData['paymentMethod']) {
                    case 'CASH':
                        // COD - Thanh toán khi nhận hàng
                        $order->paymentStatus = Order::PAYMENT_STATUS_UNPAID;
                        $order->status = Order::STATUS_CONFIRMED;
                        $payment->status = Payment::STATUS_PENDING;
                        
                        $response = [
                            'paymentMethod' => 'COD',
                            'message' => 'Đơn hàng đã được xác nhận. Thanh toán khi nhận hàng.',
                            'nextStep' => 'wait_for_delivery'
                        ];
                        break;

                    case 'E_WALLET':
                    case 'BANK_TRANSFER':
                        // Chuyển hướng đến cổng thanh toán
                        $paymentUrl = $this->generatePaymentUrl($payment);
                        
                        $response = [
                            'paymentMethod' => $paymentData['paymentMethod'],
                            'paymentUrl' => $paymentUrl,
                            'transactionCode' => $transactionCode,
                            'message' => 'Vui lòng hoàn tất thanh toán',
                            'nextStep' => 'redirect_to_payment'
                        ];
                        break;

                    case 'CREDIT_CARD':
                        // Xử lý thẻ tín dụng (tương tự e-wallet)
                        $paymentUrl = $this->generatePaymentUrl($payment);
                        
                        $response = [
                            'paymentMethod' => 'CREDIT_CARD',
                            'paymentUrl' => $paymentUrl,
                            'transactionCode' => $transactionCode,
                            'message' => 'Vui lòng hoàn tất thanh toán bằng thẻ',
                            'nextStep' => 'redirect_to_payment'
                        ];
                        break;
                }

                $order->save();
                $payment->save();

                // Load order với relationships
                $order->load(['items.productVariant.product', 'payment']);

                return [
                    'isProcessed' => true,
                    'response' => [
                        'code' => HttpCode::SUCCESS,
                        'status' => true,
                        'msgCode' => MsgCode::SUCCESS,
                        'message' => 'Xử lý thanh toán thành công',
                        'data' => array_merge([
                            'order' => $order,
                            'payment' => $payment
                        ], $response)
                    ]
                ];
            });

        } catch (Exception $e) {
            Log::error('Handle payment method failed: ' . $e->getMessage());
            return [
                'isProcessed' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Xử lý thanh toán thất bại'
                ]
            ];
        }
    }

    private function performPaymentConfirmation($payment, $confirmationData) 
    {
        try {
            return DB::transaction(function () use ($payment, $confirmationData) {
                $order = $payment->order;

                // Cập nhật payment status
                $payment->status = $confirmationData['status'];
                $payment->save();

                // Cập nhật order status dựa trên payment status
                switch ($confirmationData['status']) {
                    case 'PAID':
                        $order->paymentStatus = Order::PAYMENT_STATUS_PAID;
                        $order->status = Order::STATUS_CONFIRMED;
                        $message = 'Thanh toán thành công';
                        break;

                    case 'FAILED':
                        $order->paymentStatus = Order::PAYMENT_STATUS_FAILED;
                        $message = 'Thanh toán thất bại';
                        break;

                    case 'CANCELLED':
                        $order->paymentStatus = Order::PAYMENT_STATUS_CANCELLED;
                        $order->status = Order::STATUS_CANCELLED;
                        $message = 'Thanh toán đã bị hủy';
                        
                        // Hoàn lại stock
                        foreach ($order->items as $item) {
                            $product = $item->productVariant->product;
                            if (isset($product->quantity)) {
                                $product->quantity += $item->quantity;
                                $product->save();
                            }
                        }
                        break;
                }

                $order->save();

                // Load order với relationships
                $order->load(['items.productVariant.product', 'payment']);

                return [
                    'isConfirmed' => true,
                    'response' => [
                        'code' => HttpCode::SUCCESS,
                        'status' => true,
                        'msgCode' => MsgCode::SUCCESS,
                        'message' => $message,
                        'data' => [
                            'order' => $order,
                            'payment' => $payment
                        ]
                    ]
                ];
            });

        } catch (Exception $e) {
            Log::error('Payment confirmation failed: ' . $e->getMessage());
            return [
                'isConfirmed' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Xác nhận thanh toán thất bại'
                ]
            ];
        }
    }

    private function generateTransactionCode() 
    {
        return 'TXN' . time() . rand(1000, 9999);
    }

    private function generatePaymentUrl($payment) 
    {
        // Tạo URL thanh toán (VNPay, MoMo, etc.)
        // Đây là mock URL, thực tế cần integrate với payment gateway
        $baseUrl = config('app.url');
        return $baseUrl . '/payment/process/' . $payment->transactionCode;
    }
}
