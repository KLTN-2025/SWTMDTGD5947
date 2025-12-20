<?php

namespace App\Http\Controllers;

use App\services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
     * GET /api/payments/return - Return URL sau khi thanh toán (MoMo)
     */
    public function paymentReturn(Request $request) 
    {
        // Xử lý return từ MoMo
        $transactionCode = $request->input('transaction_code') ?? $request->input('orderId');

        // MoMo: resultCode = 0 => thành công
        if ($request->has('resultCode')) {
            $resultCode = (int) $request->input('resultCode');
            $status = $resultCode === 0 ? 'PAID' : 'FAILED';
            $amount = $request->input('amount');
        } else {
            // Fallback generic
            $status = $request->input('status', 'PAID');
            $amount = $request->input('amount');
        }
        
        // Tạo request object để gọi confirmPayment (mapping về format nội bộ)
        $confirmRequest = new Request([
            'transactionCode' => $transactionCode,
            'status' => $status,
            'amount' => $amount,
        ]);

        $result = $this->paymentService->confirmPayment($confirmRequest);
        
        // Redirect về frontend với kết quả
        // Sử dụng route callback riêng để tránh vấn đề auth
        $frontendUrl = env('FRONT_END_URL', 'http://localhost:5001');
        
        if ($result['status']) {
            return redirect($frontendUrl . '/payment/callback?payment=success&orderId=' . $result['data']['order']['id']);
        } else {
            return redirect($frontendUrl . '/payment/callback?payment=failed');
        }
    }

    /**
     * GET /api/payments/vnpay/return - Return URL sau khi thanh toán VNPay
     */
    public function vnpayReturn(Request $request) 
    {
        // Verify VNPay signature
        $vnpHashSecret = config('vnpay.hash_secret');
        $inputData = $request->all();
        $vnpSecureHash = $inputData['vnp_SecureHash'] ?? '';
        
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);
        
        ksort($inputData);
        $hashData = '';
        $i = 0;
        
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }
        
        $secureHash = hash_hmac('sha512', $hashData, $vnpHashSecret);
        
        // Lấy thông tin giao dịch
        $transactionCode = $request->input('vnp_TxnRef');
        $responseCode = $request->input('vnp_ResponseCode');
        $amount = $request->input('vnp_Amount') / 100; // VNPay trả về amount * 100
        
        // Verify signature
        if ($secureHash !== $vnpSecureHash) {
            Log::warning('VNPay return signature verification failed', [
                'transactionCode' => $transactionCode,
                'ip' => $request->ip()
            ]);
            
            $frontendUrl = env('FRONT_END_URL', 'http://localhost:5001');
            return redirect($frontendUrl . '/payment/callback?payment=failed&error=invalid_signature');
        }
        
        // VNPay: responseCode = '00' => thành công
        $isPaymentSuccess = $responseCode === '00';
        $status = $isPaymentSuccess ? 'PAID' : 'FAILED';
        
        // Tạo request object để gọi confirmPayment
        $confirmRequest = new Request([
            'transactionCode' => $transactionCode,
            'status' => $status,
            'amount' => $amount,
        ]);

        $result = $this->paymentService->confirmPayment($confirmRequest);
        
        // Redirect về frontend với kết quả
        // Sử dụng env variable thay vì hardcode
        $frontendUrl = env('FRONT_END_URL', 'http://localhost:5001');
        
        // Kiểm tra cả kết quả API và trạng thái thanh toán thực sự
        if ($result['status'] && $isPaymentSuccess) {
            // Redirect về trang callback riêng để xử lý, tránh vấn đề auth
            return redirect($frontendUrl . '/payment/callback?payment=success&orderId=' . $result['data']['order']['id']);
        } else {
            // Thanh toán thất bại hoặc bị huỷ
            $orderId = $result['data']['order']['id'] ?? null;
            $redirectUrl = $frontendUrl . '/payment/callback?payment=failed';
            if ($orderId) {
                $redirectUrl .= '&orderId=' . $orderId;
            }
            return redirect($redirectUrl);
        }
    }

    /**
     * POST /api/payments/webhook - Webhook từ payment gateway
     */
    public function paymentWebhook(Request $request) 
    {
        // Xử lý webhook từ payment gateway (VNPay, MoMo, etc.)
        
        // Mapping MoMo IPN về format nội bộ nếu có
        if ($request->has('orderId') && $request->has('resultCode')) {
            // Verify MoMo signature
            if (!$this->verifyMoMoSignature($request)) {
                Log::warning('MoMo webhook signature verification failed', [
                    'orderId' => $request->input('orderId'),
                    'ip' => $request->ip()
                ]);
                return response()->json(['status' => 'invalid_signature'], 403);
            }

            $transactionCode = $request->input('orderId');
            $resultCode = (int) $request->input('resultCode');
            $status = $resultCode === 0 ? 'PAID' : 'FAILED';
            $amount = $request->input('amount');

            $mappedRequest = new Request([
                'transactionCode' => $transactionCode,
                'status' => $status,
                'amount' => $amount,
            ]);

            $result = $this->paymentService->confirmPayment($mappedRequest);
        } else {
            $result = $this->paymentService->confirmPayment($request);
        }
        
        // Trả về response cho payment gateway
        if ($result['status']) {
            return response()->json(['status' => 'success'], 200);
        } else {
            return response()->json(['status' => 'failed'], 400);
        }
    }

    /**
     * Verify MoMo webhook signature
     */
    private function verifyMoMoSignature(Request $request): bool
    {
        $secretKey = config('momo.secret_key');
        
        if (empty($secretKey)) {
            Log::warning('MoMo secret key not configured, skipping signature verification');
            return true; // Skip verification if not configured
        }

        // Lấy các tham số từ MoMo IPN
        $partnerCode = $request->input('partnerCode');
        $orderId = $request->input('orderId');
        $requestId = $request->input('requestId');
        $amount = $request->input('amount');
        $orderInfo = $request->input('orderInfo');
        $orderType = $request->input('orderType');
        $transId = $request->input('transId');
        $resultCode = $request->input('resultCode');
        $message = $request->input('message');
        $payType = $request->input('payType');
        $responseTime = $request->input('responseTime');
        $extraData = $request->input('extraData', '');
        $signature = $request->input('signature');

        // Tạo rawHash theo tài liệu MoMo IPN
        $rawHash = "accessKey=" . config('momo.access_key')
            . "&amount={$amount}"
            . "&extraData={$extraData}"
            . "&message={$message}"
            . "&orderId={$orderId}"
            . "&orderInfo={$orderInfo}"
            . "&orderType={$orderType}"
            . "&partnerCode={$partnerCode}"
            . "&payType={$payType}"
            . "&requestId={$requestId}"
            . "&responseTime={$responseTime}"
            . "&resultCode={$resultCode}"
            . "&transId={$transId}";

        $expectedSignature = hash_hmac('sha256', $rawHash, $secretKey);

        return hash_equals($expectedSignature, $signature);
    }
}
