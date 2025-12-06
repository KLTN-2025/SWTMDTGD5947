<?php

namespace App\Http\Controllers;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\services\AuthService;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request)
    {
        $result = $this->authService->login($request->email, $request->password);

        if (isset($result['cookie'])) {
            $cookie = $result['cookie'];
            unset($result['cookie']);
            return response()->json($result)->cookie($cookie);
        }

        return response()->json($result);
    }

    public function logout()
    {
        return response()->json([
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::LOGIN_SUCCESS,
            'message' => 'Đăng xuất thành công',
        ])->withoutCookie('token');
    }

    public function register(Request $request) {
        return $this->authService->register($request);
    }

    public function me(Request $request)
    {
        // Middleware 'auth' đã push user vào request
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'code' => HttpCode::UNAUTHORIZED,
                'status' => false,
                'msgCode' => MsgCode::UNAUTHORIZED,
                'message' => 'Chưa đăng nhập',
            ], HttpCode::UNAUTHORIZED);
        }

        return response()->json([
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Lấy thông tin người dùng thành công',
            'data' => $user,
        ]);
    }

    public function google () {
       return Socialite::driver('google')->stateless()->redirect();
    }

    public function googleCallBack() {
        $googleUser = Socialite::driver('google')->stateless()->user();
        $result = $this->authService->googleCallBack($googleUser->user);
        
        $frontendUrl = config('app.frontend_url', 'http://localhost:5001');
        
        if (isset($result['cookie'])) {
            $cookie = $result['cookie'];
            
            // Check if login was successful
            if ($result['status'] === true) {
                // Redirect to frontend auth callback page with success flag
                // This gives time for cookie to be set before checkAuth is called
                return redirect($frontendUrl . '/auth?google=success')
                    ->cookie($cookie);
            } else {
                // Redirect to auth page with error
                return redirect($frontendUrl . '/auth?error=' . urlencode($result['message']));
            }
        }
        
        // Fallback: redirect with error
        return redirect($frontendUrl . '/auth?error=' . urlencode('Đăng nhập thất bại'));
    }

    public function sendPasswordResetEmail(Request $request) {
        return $this->authService->sendPasswordResetEmail($request->email);
    }

    public function resetPassword(Request $request) {
        return $this->authService->resetPassword($request);
    }
}
