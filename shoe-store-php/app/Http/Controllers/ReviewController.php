<?php

namespace App\Http\Controllers;

use App\services\ReviewService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    /**
     * POST /api/reviews - Tạo đánh giá mới
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $result = $this->reviewService->createReview($user, $request);
        return response()->json($result, $result['code']);
    }

    /**
     * PUT /api/reviews/{id} - Cập nhật đánh giá
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $result = $this->reviewService->updateReview($user, $id, $request);
        return response()->json($result, $result['code']);
    }

    /**
     * DELETE /api/reviews/{id} - Xóa đánh giá
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $result = $this->reviewService->deleteReview($user, $id);
        return response()->json($result, $result['code']);
    }
}
