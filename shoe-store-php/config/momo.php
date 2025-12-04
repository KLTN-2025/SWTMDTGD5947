<?php

return [
    'partner_code' => env('MOMO_PARTNER_CODE', ''),
    'access_key' => env('MOMO_ACCESS_KEY', ''),
    'secret_key' => env('MOMO_SECRET_KEY', ''),

    // API endpoint (sandbox by default)
    'endpoint' => env('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create'),

    // URLs for redirect & IPN (callback)
    'redirect_url' => env('MOMO_REDIRECT_URL', 'http://localhost:5001/orders'),
    'ipn_url' => env('MOMO_IPN_URL', env('APP_URL', 'http://localhost:8009') . '/api/payments/webhook'),

    // Request type, typically captureWallet for MoMo QR/APP
    'request_type' => env('MOMO_REQUEST_TYPE', 'captureWallet'),
];

