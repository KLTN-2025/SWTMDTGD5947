<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Exception;

class ShareService
{
    /**
     * Lấy các link chia sẻ sản phẩm
     */
    public function getProductShareLinks($productId)
    {
        try {
            $product = Product::find($productId);
            
            if (!$product) {
                return [
                    'code' => HttpCode::NOT_FOUND,
                    'status' => false,
                    'msgCode' => MsgCode::NOT_FOUND,
                    'message' => 'Sản phẩm không tồn tại',
                ];
            }

            // Lấy config từ env
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5001');
            $appId = env('FACEBOOK_APP_ID');
            
            // Validate app_id
            if (empty($appId)) {
                Log::warning('FACEBOOK_APP_ID is not set in .env file');
                return [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Facebook App ID chưa được cấu hình',
                ];
            }
            
            $sharePostUrl = env('SHARE_FACEBOOK_POST_URL', 'https://www.facebook.com/dialog/share');
            $shareMessengerUrl = env('SHARE_MESSENGER_URL', 'https://www.facebook.com/dialog/send');

            // Tạo product URL (theo yêu cầu: /products/{skuId})
            $productUrl = "{$frontendUrl}/products/{$product->id}";
            
            // Encode URL đúng cách (tương đương encodeURIComponent trong JS)
            $encodedProductUrl = rawurlencode($productUrl);

            // Tạo quote text với tên sản phẩm và giá (theo format NestJS)
            $formattedPrice = number_format($product->basePrice, 0, ',', '.');
            $quoteText = rawurlencode("Xem sản phẩm: {$product->name} - Giá: {$formattedPrice} VND");

            // Tạo link chia sẻ Facebook
            $facebookShare = $this->buildFacebookShareUrl($appId, $encodedProductUrl, $sharePostUrl, $quoteText);

            // Tạo link chia sẻ Messenger
            $messengerShare = $this->buildMessengerShareUrl($appId, $encodedProductUrl, $frontendUrl, $shareMessengerUrl);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy link chia sẻ thành công',
                'data' => [
                    'product' => [
                        'id' => $product->id,
                        'skuId' => $product->skuId,
                        'name' => $product->name,
                        'url' => $productUrl,
                    ],
                    'shareLinks' => [
                        'facebookPost' => $facebookShare,
                        'messenger' => $messengerShare,
                    ]
                ]
            ];
        } catch (Exception $e) {
            Log::error('Get product share links failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy link chia sẻ thất bại',
            ];
        }
    }

    /**
     * Tạo link chia sẻ Facebook
     */
    private function buildFacebookShareUrl($appId, $encodedUrl, $sharePostUrl, $quote)
    {
        return "{$sharePostUrl}?app_id={$appId}&display=popup&href={$encodedUrl}&quote={$quote}";
    }

    /**
     * Tạo link chia sẻ Messenger
     */
    private function buildMessengerShareUrl($appId, $encodedUrl, $redirectUrl, $shareMessengerUrl)
    {
        try {
            $encodedRedirectUrl = rawurlencode($redirectUrl);
            return "{$shareMessengerUrl}?app_id={$appId}&link={$encodedUrl}&redirect_uri={$encodedRedirectUrl}";
        } catch (Exception $e) {
            Log::error('Build messenger share URL failed: ' . $e->getMessage());
            throw $e;
        }
    }
}

