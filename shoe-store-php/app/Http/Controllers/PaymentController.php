<?php

namespace App\Http\Controllers;

use App\services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService) 
    {
        $this->paymentService = $paymentService;
    }

    /**
     * POST /api/payments - Xử lý thanh toán cho đơn hàng
     */
    public function processPayment(Request $request) 
    {
        $user = $request->user();
        $result = $this->paymentService->processPayment($user, $request);
        return response()->json($result, $result['code']);
    }

    /**
     * POST /api/payments/confirm - Xác nhận thanh toán (webhook/callback)
     */
    public function confirmPayment(Request $request) 
    {
        $result = $this->paymentService->confirmPayment($request);
        return response()->json($result, $result['code']);
    }

    /**
     * GET /api/payments/return - Return URL sau khi thanh toán
     */
    public function paymentReturn(Request $request) 
    {
        // Xử lý return từ payment gateway
        $transactionCode = $request->input('transaction_code');
        $status = $request->input('status', 'PAID');
        
        // Tạo request object để gọi confirmPayment
        $confirmRequest = new Request([
            'transactionCode' => $transactionCode,
            'status' => $status,
            'amount' => $request->input('amount')
        ]);

        $result = $this->paymentService->confirmPayment($confirmRequest);
        
        // Redirect về frontend với kết quả
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        
        if ($result['status']) {
            return redirect($frontendUrl . '/orders/' . $result['data']['order']['id'] . '?payment=success');
        } else {
            return redirect($frontendUrl . '/orders?payment=failed');
        }
    }

    /**
     * POST /api/payments/webhook - Webhook từ payment gateway
     */
    public function paymentWebhook(Request $request) 
    {
        // Xử lý webhook từ payment gateway (VNPay, MoMo, etc.)
        // Thường cần verify signature để đảm bảo tính bảo mật
        
        $result = $this->paymentService->confirmPayment($request);
        
        // Trả về response cho payment gateway
        if ($result['status']) {
            return response()->json(['status' => 'success'], 200);
        } else {
            return response()->json(['status' => 'failed'], 400);
        }
    }
}
