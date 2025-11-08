<?php

namespace App\Http\Middleware;

use App\Helper\Constants;
use App\Helper\HttpCode;
use App\Helper\MsgCode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class UserMiddleware
{
    /**
     * Handle an incoming request.
     * Kiểm tra user đã đăng nhập và có role USER
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Lấy token từ cookie
            $token = $request->cookie('token');

            if (!$token) {
                return response()->json([
                    'code' => HttpCode::UNAUTHORIZED,
                    'status' => false,
                    'msgCode' => MsgCode::UNAUTHORIZED,
                    'message' => 'Bạn chưa đăng nhập'
                ], HttpCode::UNAUTHORIZED);
            }

            // Set token và authenticate user
            JWTAuth::setToken($token);
            $user = JWTAuth::authenticate();

            if (!$user) {
                return response()->json([
                    'code' => HttpCode::UNAUTHORIZED,
                    'status' => false,
                    'msgCode' => MsgCode::UNAUTHORIZED,
                    'message' => 'Token không hợp lệ'
                ], HttpCode::UNAUTHORIZED);
            }

            // Kiểm tra role USER
            if (!$user->role || $user->role->name !== Constants::USER) {
                return response()->json([
                    'code' => HttpCode::FORBIDDEN,
                    'status' => false,
                    'msgCode' => MsgCode::FORBIDDEN,
                    'message' => 'Bạn không có quyền truy cập. Chỉ USER mới được phép.'
                ], HttpCode::FORBIDDEN);
            }

            // Set user vào auth guard
            auth('api')->setUser($user);

            return $next($request);

        } catch (JWTException $e) {
            return response()->json([
                'code' => HttpCode::UNAUTHORIZED,
                'status' => false,
                'msgCode' => MsgCode::UNAUTHORIZED,
                'message' => 'Token không hợp lệ hoặc đã hết hạn'
            ], HttpCode::UNAUTHORIZED);
        }
    }
}
