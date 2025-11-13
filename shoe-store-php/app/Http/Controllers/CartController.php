<?php

namespace App\Http\Controllers;

use App\services\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    protected $cartService;
    public function __construct(CartService $cartService) {
        $this->cartService = $cartService;
    }

    public function addToCart(Request $request) {
        $user = $request->user();
        $result = $this->cartService->addTocart($user, $request);
        return response()->json($result);
    }

    public function getCartItems(Request $request) {
        $user = $request->user();
        $result = $this->cartService->getCartItems($user);
        return response()->json($result);
    }

    public function updateCartItem(Request $request, $cartItemId) {
        $user = $request->user();
        $result = $this->cartService->updateCartItem($user, $cartItemId, $request);
        return response()->json($result);
    }

    public function deleteCartItem(Request $request, $cartItemId) {
        $user = $request->user();
        $result = $this->cartService->deleteCartItem($user, $cartItemId);
        return response()->json($result);
    }

    public function clearCart(Request $request) {
        $user = $request->user();
        $result = $this->cartService->clearCart($user);
        return response()->json($result);
    }
}
