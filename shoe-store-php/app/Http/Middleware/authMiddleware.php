<?php

namespace App\Http\Middleware;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

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
            ]);
        }
        return $next($request);
    }
}
