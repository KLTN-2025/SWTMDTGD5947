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

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     * Kiểm tra user đã đăng nhập và có role ADMIN
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

            if (!$user->role || !in_array($user->role->name, [Constants::ADMIN, Constants::SUPER_ADMIN])) {
                return response()->json([
                    'code' => HttpCode::FORBIDDEN,
                    'status' => false,
                    'msgCode' => MsgCode::FORBIDDEN,
                    'message' => 'Bạn không có quyền truy cập. Chỉ ADMIN hoặc SUPER ADMIN mới được phép.'
                ], HttpCode::FORBIDDEN);
            }

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
