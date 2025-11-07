<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/users', function (Request $request) {
    dd($request->user());
})->middleware('admin');

Route::group(['prefix' => 'auth'], function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::post('/register', [AuthController::class, 'register']);
    Route::get('/google', [AuthController::class, 'google'])->middleware('web');
    Route::get('/google/callback', [AuthController::class, 'googleCallBack'])->middleware('web');
    Route::post('/send-email-reset-pass', [AuthController::class, 'sendPasswordResetEmail']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Public Product Routes - For Client/Customer (Read-only)
Route::group(['prefix' => 'products'], function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/search', [ProductController::class, 'search']);
    Route::get('/{id}', [ProductController::class, 'show']);
});

// Public Category Routes - For Client/Customer (Read-only)
Route::group(['prefix' => 'categories'], function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{id}', [CategoryController::class, 'show']);
});

// Admin Routes - Protected by auth + admin middleware
Route::group(['prefix' => 'admin/products'], function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/search', [ProductController::class, 'search']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::post('/', [ProductController::class, 'store']);
    Route::put('/{id}', [ProductController::class, 'update']);
    Route::post('/{id}', [ProductController::class, 'update']);
    Route::delete('/{id}', [ProductController::class, 'destroy']);
    Route::delete('/images/{imageId}', [ProductController::class, 'deleteImage']);
});

// Admin Category Routes - Protected by auth + admin middleware
Route::group(['prefix' => 'admin/categories'], function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{id}', [CategoryController::class, 'show']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::post('/{id}', [CategoryController::class, 'update']);
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
});
