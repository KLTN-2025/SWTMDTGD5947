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

    public function google () {
       return Socialite::driver('google')->stateless()->redirect();
    }

    public function googleCallBack() {
        $googleUser = Socialite::driver('google')->stateless()->user();
        $result = $this->authService->googleCallBack($googleUser->user);
        if (isset($result['cookie'])) {
            $cookie = $result['cookie'];
            unset($result['cookie']);
            return response()->json($result)->cookie($cookie);
        }
        return response()->json($result);
    }

    public function sendPasswordResetEmail(Request $request) {
        return $this->authService->sendPasswordResetEmail($request->email);
    }

    public function resetPassword(Request $request) {
        return $this->authService->resetPassword($request);
    }
}
