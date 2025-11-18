<?php
namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

class ReviewService
{
    /**
     * Tạo đánh giá mới cho sản phẩm
     */
    public function createReview($user, $request)
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'productId' => 'required|integer|exists:products,id',
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|min:10|max:500',
            ]);

            if ($validator->fails()) {
                return [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ];
            }

            // Kiểm tra sản phẩm có tồn tại không
            $product = Product::find($request->productId);
            if (!$product) {
                return [
                    'code' => HttpCode::NOT_FOUND,
                    'status' => false,
                    'msgCode' => MsgCode::NOT_FOUND,
                    'message' => 'Không tìm thấy sản phẩm'
                ];
            }

            // Kiểm tra user đã đánh giá sản phẩm này chưa
            $existingReview = Review::where('userId', $user->id)
                ->where('productId', $request->productId)
                ->first();

            if ($existingReview) {
                return [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => 'Bạn đã đánh giá sản phẩm này rồi. Bạn có thể cập nhật đánh giá của mình.'
                ];
            }

            // Tạo review mới
            $review = Review::create([
                'userId' => $user->id,
                'productId' => $request->productId,
                'rating' => $request->rating,
                'comment' => $request->comment ?? null,
            ]);

            // Load relationships
            $review->load(['user:id,name,email,imageUrl']);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Đánh giá đã được gửi thành công',
                'data' => $review
            ];

        } catch (Exception $e) {
            Log::error('Create review failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Tạo đánh giá thất bại'
            ];
        }
    }

    /**
     * Cập nhật đánh giá
     */
    public function updateReview($user, $reviewId, $request)
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|min:10|max:500',
            ]);

            if ($validator->fails()) {
                return [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ];
            }

            // Tìm review
            $review = Review::where('id', $reviewId)
                ->where('userId', $user->id)
                ->first();

            if (!$review) {
                return [
                    'code' => HttpCode::NOT_FOUND,
                    'status' => false,
                    'msgCode' => MsgCode::NOT_FOUND,
                    'message' => 'Không tìm thấy đánh giá'
                ];
            }

            // Cập nhật review
            $review->rating = $request->rating;
            $review->comment = $request->comment ?? null;
            $review->save();

            // Load relationships
            $review->load(['user:id,name,email,imageUrl']);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Cập nhật đánh giá thành công',
                'data' => $review
            ];

        } catch (Exception $e) {
            Log::error('Update review failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Cập nhật đánh giá thất bại'
            ];
        }
    }

    /**
     * Xóa đánh giá
     */
    public function deleteReview($user, $reviewId)
    {
        try {
            $review = Review::where('id', $reviewId)
                ->where('userId', $user->id)
                ->first();

            if (!$review) {
                return [
                    'code' => HttpCode::NOT_FOUND,
                    'status' => false,
                    'msgCode' => MsgCode::NOT_FOUND,
                    'message' => 'Không tìm thấy đánh giá'
                ];
            }

            $review->delete();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Xóa đánh giá thành công'
            ];

        } catch (Exception $e) {
            Log::error('Delete review failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Xóa đánh giá thất bại'
            ];
        }
    }

    /**
     * Lấy danh sách đánh giá của sản phẩm
     */
    public function getProductReviews($productId, $request = null)
    {
        try {
            $perPage = $request ? $request->input('per_page', 10) : 10;
            $page = $request ? $request->input('page', 1) : 1;
            $sortBy = $request ? $request->input('sort_by', 'newest') : 'newest';
            $filterRating = $request ? $request->input('rating') : null;

            // Kiểm tra sản phẩm có tồn tại không
            $product = Product::find($productId);
            if (!$product) {
                return [
                    'code' => HttpCode::NOT_FOUND,
                    'status' => false,
                    'msgCode' => MsgCode::NOT_FOUND,
                    'message' => 'Không tìm thấy sản phẩm'
                ];
            }

            $query = Review::where('productId', $productId)
                ->with(['user:id,name,email,imageUrl']);

            // Filter by rating
            if ($filterRating && in_array($filterRating, [1, 2, 3, 4, 5])) {
                $query->where('rating', $filterRating);
            }

            // Sort
            switch ($sortBy) {
                case 'oldest':
                    $query->orderBy('createdAt', 'asc');
                    break;
                case 'rating':
                    $query->orderBy('rating', 'desc')->orderBy('createdAt', 'desc');
                    break;
                case 'newest':
                default:
                    $query->orderBy('createdAt', 'desc');
                    break;
            }

            $reviews = $query->paginate($perPage, ['*'], 'page', $page);

            // Tính toán thống kê
            $allReviews = Review::where('productId', $productId)->get();
            $totalReviews = $allReviews->count();
            $averageRating = $totalReviews > 0 ? $allReviews->avg('rating') : 0;
            $ratingCounts = [
                5 => $allReviews->where('rating', 5)->count(),
                4 => $allReviews->where('rating', 4)->count(),
                3 => $allReviews->where('rating', 3)->count(),
                2 => $allReviews->where('rating', 2)->count(),
                1 => $allReviews->where('rating', 1)->count(),
            ];

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách đánh giá thành công',
                'data' => [
                    'reviews' => $reviews->items(),
                    'pagination' => [
                        'total' => $reviews->total(),
                        'per_page' => $reviews->perPage(),
                        'current_page' => $reviews->currentPage(),
                        'last_page' => $reviews->lastPage(),
                        'from' => $reviews->firstItem(),
                        'to' => $reviews->lastItem(),
                    ],
                    'statistics' => [
                        'total' => $totalReviews,
                        'average' => round($averageRating, 1),
                        'ratingCounts' => $ratingCounts,
                    ]
                ]
            ];

        } catch (Exception $e) {
            Log::error('Get product reviews failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách đánh giá thất bại'
            ];
        }
    }
}

