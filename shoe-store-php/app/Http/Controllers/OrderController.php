<?php

namespace App\Http\Controllers;

use App\services\CheckoutService;
use App\services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $checkoutService;
    protected $orderService;

    public function __construct(CheckoutService $checkoutService, OrderService $orderService) 
    {
        $this->checkoutService = $checkoutService;
        $this->orderService = $orderService;
    }

    /**
     * POST /api/checkout - Tạo đơn hàng từ giỏ hàng
     */
    public function checkout(Request $request) 
    {
        $user = $request->user();
        $result = $this->checkoutService->checkout($user, $request);
        return response()->json($result, $result['code']);
    }

    /**
     * GET /api/checkout/calculate - Tính toán checkout (preview)
     */
    public function calculateCheckout(Request $request) 
    {
        $user = $request->user();
        $result = $this->checkoutService->calculateCheckout($user);
        return response()->json($result, $result['code']);
    }

    /**
     * GET /api/orders - Lịch sử đơn hàng của user
     */
    public function index(Request $request) 
    {
        $user = $request->user();
        $result = $this->orderService->getUserOrders($user, $request);
        return response()->json($result, $result['code']);
    }

    /**
     * GET /api/orders/{id} - Chi tiết đơn hàng
     */
    public function show(Request $request, $orderId) 
    {
        $user = $request->user();
        $result = $this->orderService->getOrderDetail($user, $orderId);
        return response()->json($result, $result['code']);
    }

    /**
     * PUT /api/orders/{id}/cancel - Hủy đơn hàng
     */
    public function cancel(Request $request, $orderId) 
    {
        $user = $request->user();
        $result = $this->orderService->cancelOrder($user, $orderId);
        return response()->json($result, $result['code']);
    }
}
