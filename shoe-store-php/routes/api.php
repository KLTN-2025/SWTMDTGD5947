<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ============================================================================
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
});

// Categories
Route::group(['prefix' => 'categories'], function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{id}', [CategoryController::class, 'show']);
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
        Route::post('/{id}', [UserController::class, 'update']); // For form-data
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });
});
