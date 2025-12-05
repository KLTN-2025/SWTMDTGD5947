<?php

/**
 * Debug VNPay URL Generation
 * Run: php debug-vnpay-url.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== VNPay URL Debug ===\n\n";

$vnpUrl = config('vnpay.url');
$vnpTmnCode = config('vnpay.tmn_code');
$vnpHashSecret = config('vnpay.hash_secret');
$vnpReturnUrl = config('vnpay.return_url');

echo "Config:\n";
echo "  TMN Code: $vnpTmnCode\n";
echo "  Hash Secret: " . substr($vnpHashSecret, 0, 10) . "...\n";
echo "  URL: $vnpUrl\n";
echo "  Return URL: $vnpReturnUrl\n\n";

// Test data
$amount = 500000; // 500,000 VND
$vnpAmount = $amount * 100; // 50,000,000
$transactionCode = 'TEST' . time();
$orderId = 123;

echo "Test Data:\n";
echo "  Amount: " . number_format($amount) . " VND\n";
echo "  VNP Amount: " . number_format($vnpAmount) . "\n";
echo "  Transaction Code: $transactionCode\n";
echo "  Order ID: $orderId\n\n";

// Build input data
$inputData = [
    'vnp_Version' => '2.1.0',
    'vnp_TmnCode' => $vnpTmnCode,
    'vnp_Amount' => (string) $vnpAmount, // String format
    'vnp_Command' => 'pay',
    'vnp_CreateDate' => date('YmdHis'),
    'vnp_CurrCode' => 'VND',
    'vnp_IpAddr' => '127.0.0.1',
    'vnp_Locale' => 'vn',
    'vnp_OrderInfo' => 'Thanh toan don hang #' . $orderId,
    'vnp_OrderType' => 'other',
    'vnp_ReturnUrl' => $vnpReturnUrl,
    'vnp_TxnRef' => $transactionCode,
];

echo "Input Data:\n";
foreach ($inputData as $key => $value) {
    echo "  $key: $value\n";
}
echo "\n";

// Sort by key
ksort($inputData);

// Build query string and hash data
$query = '';
$hashdata = '';
$i = 0;

foreach ($inputData as $key => $value) {
    if ($i == 1) {
        $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
    } else {
        $hashdata .= urlencode($key) . "=" . urlencode($value);
        $i = 1;
    }
    $query .= urlencode($key) . "=" . urlencode($value) . '&';
}

echo "Hash Data (for signature):\n";
echo "  " . substr($hashdata, 0, 150) . "...\n\n";

// Generate signature
$vnpSecureHash = hash_hmac('sha512', $hashdata, $vnpHashSecret);

echo "Signature:\n";
echo "  Algorithm: SHA512\n";
echo "  Hash: $vnpSecureHash\n\n";

// Build final URL
$finalUrl = $vnpUrl . "?" . $query . 'vnp_SecureHash=' . $vnpSecureHash;

echo "Final URL:\n";
echo "  Length: " . strlen($finalUrl) . " chars\n";
echo "  URL: " . substr($finalUrl, 0, 200) . "...\n\n";

// Verify URL components
echo "URL Components:\n";
$parsedUrl = parse_url($finalUrl);
echo "  Scheme: " . ($parsedUrl['scheme'] ?? 'N/A') . "\n";
echo "  Host: " . ($parsedUrl['host'] ?? 'N/A') . "\n";
echo "  Path: " . ($parsedUrl['path'] ?? 'N/A') . "\n";

parse_str($parsedUrl['query'] ?? '', $queryParams);
echo "  Query Params: " . count($queryParams) . "\n";

foreach ($queryParams as $key => $value) {
    if ($key === 'vnp_SecureHash') {
        echo "    $key: " . substr($value, 0, 20) . "...\n";
    } else {
        echo "    $key: $value\n";
    }
}

echo "\n";

// Validation checks
echo "Validation:\n";

$checks = [
    'vnp_Version exists' => isset($queryParams['vnp_Version']),
    'vnp_TmnCode exists' => isset($queryParams['vnp_TmnCode']),
    'vnp_Amount exists' => isset($queryParams['vnp_Amount']),
    'vnp_Command exists' => isset($queryParams['vnp_Command']),
    'vnp_CreateDate exists' => isset($queryParams['vnp_CreateDate']),
    'vnp_CurrCode exists' => isset($queryParams['vnp_CurrCode']),
    'vnp_IpAddr exists' => isset($queryParams['vnp_IpAddr']),
    'vnp_Locale exists' => isset($queryParams['vnp_Locale']),
    'vnp_OrderInfo exists' => isset($queryParams['vnp_OrderInfo']),
    'vnp_OrderType exists' => isset($queryParams['vnp_OrderType']),
    'vnp_ReturnUrl exists' => isset($queryParams['vnp_ReturnUrl']),
    'vnp_TxnRef exists' => isset($queryParams['vnp_TxnRef']),
    'vnp_SecureHash exists' => isset($queryParams['vnp_SecureHash']),
    'vnp_Amount is numeric' => is_numeric($queryParams['vnp_Amount'] ?? ''),
    'vnp_CreateDate format' => preg_match('/^\d{14}$/', $queryParams['vnp_CreateDate'] ?? ''),
];

$allPassed = true;
foreach ($checks as $check => $result) {
    $status = $result ? '✅' : '❌';
    echo "  $status $check\n";
    if (!$result) {
        $allPassed = false;
    }
}

echo "\n";

if ($allPassed) {
    echo "✅ All validation checks passed!\n";
    echo "✅ URL format is correct\n\n";
    echo "You can test this URL in browser:\n";
    echo "$finalUrl\n\n";
} else {
    echo "❌ Some validation checks failed!\n";
    echo "Please review the URL format.\n\n";
}

echo "Done! 🚀\n";
