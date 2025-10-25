<?php

use App\Http\Controllers\AuthController;
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
