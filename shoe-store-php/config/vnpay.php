<?php

return [
    'tmn_code' => env('VNPAY_TMN_CODE', ''),
    'hash_secret' => env('VNPAY_HASH_SECRET', ''),
    
    // Payment URL (sandbox by default)
    'url' => env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    
    // Return URL after payment
    'return_url' => env('VNPAY_RETURN_URL', env('APP_URL', 'http://localhost:8009') . '/api/payments/vnpay/return'),
    
    // API URL for query/refund (optional)
    'api_url' => env('VNPAY_API_URL', 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'),
];
