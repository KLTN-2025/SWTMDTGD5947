<?php

use App\Http\Controllers\AdminChatBoxController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\SizeController;
use App\Http\Controllers\ChatBoxController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ==========================-0==================================================
// AUTHENTICATION ROUTES
// ============================================================================
Route::group(['prefix' => 'auth'], function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::post('/register', [AuthController::class, 'register']);
    Route::get('/google', [AuthController::class, 'google'])->middleware('web');
    Route::get('/google/callback', [AuthController::class, 'googleCallBack'])->middleware('web');
    Route::post('/send-email-reset-pass', [AuthController::class, 'sendPasswordResetEmail']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::group(['prefix' => 'profile' , 'middleware' => ['user']], function () {
    Route::get('/', [ProfileController::class, 'getProfile']);
    Route::post('/update', [ProfileController::class, 'updateProfile']);
    Route::post('/change-password', [ProfileController::class, 'changePassword']);
});

// ============================================================================
// PUBLIC ROUTES - For Client/Customer (Read-only)
// ============================================================================

// Products
Route::group(['prefix' => 'products'], function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/search', [ProductController::class, 'search']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::get('/{id}/share', [ShareController::class, 'getProductShareLinks']);
});

Route::group(['prefix' => 'cart', 'middleware' => ['user']], function () { 
    Route::post('/', [CartController::class, 'addToCart']);
    Route::get('/', [CartController::class, 'getCartItems']);
    Route::put('/items/{cartItemId}', [CartController::class, 'updateCartItem']);
    Route::delete('/items/{cartItemId}', [CartController::class, 'deleteCartItem']);
    Route::delete('/clear', [CartController::class, 'clearCart']);
});

// Checkout & Orders
Route::group(['prefix' => 'checkout', 'middleware' => ['user']], function () {
    Route::get('/calculate', [OrderController::class, 'calculateCheckout']);
    Route::post('/', [OrderController::class, 'checkout']);
});

Route::group(['prefix' => 'orders', 'middleware' => ['user']], function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::get('/{id}', [OrderController::class, 'show']);
    Route::put('/{id}/cancel', [OrderController::class, 'cancel']);
});

// Payments
Route::group(['prefix' => 'payments'], function () {
    Route::post('/', [PaymentController::class, 'processPayment'])->middleware('user');
    Route::post('/confirm', [PaymentController::class, 'confirmPayment']);
    Route::get('/return', [PaymentController::class, 'paymentReturn']);
    Route::post('/webhook', [PaymentController::class, 'paymentWebhook']);
});

// Categories
Route::group(['prefix' => 'categories'], function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{id}', [CategoryController::class, 'show']);
});

// Colors
Route::get('/colors', [ColorController::class, 'index']);

// Sizes
Route::get('/sizes', [SizeController::class, 'index']);

// Reviews
Route::group(['prefix' => 'reviews', 'middleware' => ['user']], function () {
    Route::post('/', [ReviewController::class, 'store']);
    Route::put('/{id}', [ReviewController::class, 'update']);
    Route::delete('/{id}', [ReviewController::class, 'destroy']);
});

// Chat box assistant
Route::group(['prefix' => 'chat-box', 'middleware' => ['user']], function () {
    Route::get('/sessions', [ChatBoxController::class, 'listSessions']);
    Route::get('/sessions/{chatBoxId}', [ChatBoxController::class, 'showSession']);
    Route::post('/messages', [ChatBoxController::class, 'sendMessage']);
});

// Roles
Route::get('/roles', [RoleController::class, 'index']);

// ============================================================================
// ADMIN ROUTES - Protected by admin middleware
// ============================================================================
Route::group(['prefix' => 'admin', 'middleware' => ['admin']], function () {
    
    // Products Management
    Route::group(['prefix' => 'products'], function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/search', [ProductController::class, 'search']);
        Route::get('/{id}', [ProductController::class, 'show']);
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::post('/{id}', [ProductController::class, 'update']); // For form-data
        Route::delete('/{id}', [ProductController::class, 'destroy']);
        Route::delete('/images/{imageId}', [ProductController::class, 'deleteImage']);
    });

    // Categories Management
    Route::group(['prefix' => 'categories'], function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::get('/{id}', [CategoryController::class, 'show']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::put('/{id}', [CategoryController::class, 'update']);
        Route::post('/{id}', [CategoryController::class, 'update']); // For form-data
        Route::delete('/{id}', [CategoryController::class, 'destroy']);
    });

    // Users Management
    Route::group(['prefix' => 'users'], function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/search', [UserController::class, 'search']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::post('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });

    // Orders Management
    Route::group(['prefix' => 'orders'], function () {
        Route::get('/', [AdminOrderController::class, 'index']);
        Route::get('/{id}', [AdminOrderController::class, 'show']);
        Route::put('/{id}/status', [AdminOrderController::class, 'updateStatus']);
        Route::post('/{id}/cancel', [AdminOrderController::class, 'cancel']);
    });

    // Customers Management (chỉ quản lý users có role USER)
    Route::group(['prefix' => 'customers'], function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::put('/{id}', [CustomerController::class, 'update']);
        Route::post('/{id}', [CustomerController::class, 'updateFormData']); // For form-data
        Route::delete('/{id}', [CustomerController::class, 'destroy']);
    });

    // Chat box management
    Route::group(['prefix' => 'chat-box'], function () {
        Route::get('/messages', [AdminChatBoxController::class, 'index']);
        Route::get('/messages/{id}', [AdminChatBoxController::class, 'show']);
        Route::delete('/messages/{id}', [AdminChatBoxController::class, 'destroy']);
        Route::post('/send', [ChatBoxController::class, 'sendMessage']);
        Route::get('/sessions', [ChatBoxController::class, 'listSessions']);
        Route::get('/sessions/{chatBoxId}', [ChatBoxController::class, 'showSession']);
    });

    // Reports & Statistics
    Route::group(['prefix' => 'reports'], function () {
        Route::get('/overview', [ReportController::class, 'getOverview']);
        Route::get('/revenue', [ReportController::class, 'getRevenueByPeriod']);
        Route::get('/top-products', [ReportController::class, 'getTopSellingProducts']);
        Route::get('/rated-products', [ReportController::class, 'getRatedProducts']);
        Route::get('/top-customers', [ReportController::class, 'getTopCustomers']);
        Route::get('/revenue-by-category', [ReportController::class, 'getRevenueByCategory']);
        Route::get('/inventory', [ReportController::class, 'getInventoryStatus']);
        Route::get('/orders', [ReportController::class, 'getOrderStats']);
        Route::get('/payments', [ReportController::class, 'getPaymentStats']);
    });
});
