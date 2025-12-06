<?php

namespace App\Http\Middleware;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class authMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('token');
        
        if (!$token) {
            return response()->json([
                'code' => HttpCode::UNAUTHORIZED,
                'status' => false,
                'msgCode' => MsgCode::UNAUTHORIZED,
                'message' => 'Bạn chưa đăng nhập'
            ], HttpCode::UNAUTHORIZED);
        }

        try {
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

            // Push user vào request để controller có thể sử dụng
            $request->setUserResolver(function () use ($user) {
                return $user;
            });

            return $next($request);

        } catch (TokenExpiredException $e) {
            return response()->json([
                'code' => HttpCode::UNAUTHORIZED,
                'status' => false,
                'msgCode' => MsgCode::UNAUTHORIZED,
                'message' => 'Token đã hết hạn'
            ], HttpCode::UNAUTHORIZED);
        } catch (TokenInvalidException $e) {
            return response()->json([
                'code' => HttpCode::UNAUTHORIZED,
                'status' => false,
                'msgCode' => MsgCode::UNAUTHORIZED,
                'message' => 'Token không hợp lệ'
            ], HttpCode::UNAUTHORIZED);
        } catch (JWTException $e) {
            return response()->json([
                'code' => HttpCode::UNAUTHORIZED,
                'status' => false,
                'msgCode' => MsgCode::UNAUTHORIZED,
                'message' => 'Lỗi xác thực token'
            ], HttpCode::UNAUTHORIZED);
        }
    }
}
