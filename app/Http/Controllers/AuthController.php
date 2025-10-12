<?php

namespace App\Http\Controllers;

use App\services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
}
