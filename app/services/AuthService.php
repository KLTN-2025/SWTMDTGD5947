<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuthProvider;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
  public function login($email, $password)
  {
    $validationResult = $this->validateLoginCredentials($email, $password);
    if (!$validationResult['isValid']) {
      return $validationResult['response'];
    }

    $authResult = $this->authenticateUser($email, $password);
    if (!$authResult['isAuthenticated']) {
      return $authResult['response'];
    }

    $tokenData = $this->generateTokenAndCookie($authResult['user']);

    return $this->createSuccessResponse($tokenData['token'], $authResult['user'], $tokenData['cookie']);
  }

  private function validateLoginCredentials($email, $password)
  {
    $validator = Validator::make([
      'email' => $email,
      'password' => $password,
    ], [
      'email' => 'required|email',
      'password' => 'required|min:6',
    ], [
      'email.required' => 'Vui lòng nhập email.',
      'email.email' => 'Email không đúng định dạng.',
      'password.required' => 'Vui lòng nhập mật khẩu.',
      'password.min' => 'Mật khẩu phải có ít nhất :min ký tự.',
    ]);

    if ($validator->fails()) {
      return [
        'isValid' => false,
        'response' => [
          'code' => HttpCode::VALIDATION_ERROR,
          'status' => false,
          'msgCode' => MsgCode::VALIDATION_ERROR,
          'message' => $validator->errors(),
        ]
      ];
    }

    return ['isValid' => true];
  }

  private function authenticateUser($email, $password)
  {
    $user = User::where('email', $email)->first();

    if (!$user) {
      return [
        'isAuthenticated' => false,
        'response' => [
          'code' => HttpCode::UNAUTHORIZED,
          'status' => false,
          'msgCode' => MsgCode::LOGIN_FAILED,
          'message' => 'Email hoặc mật khẩu không đúng',
        ]
      ];
    }

    $authProvider = AuthProvider::where('userId', $user->id)
      ->where('provider', 'LOCAL')
      ->first();

    if (!$authProvider || !Hash::check($password, $authProvider->password)) {
      return [
        'isAuthenticated' => false,
        'response' => [
          'code' => HttpCode::UNAUTHORIZED,
          'status' => false,
          'msgCode' => MsgCode::LOGIN_FAILED,
          'message' => 'Email hoặc mật khẩu không đúng',
        ]
      ];
    }

    return [
      'isAuthenticated' => true,
      'user' => $user
    ];
  }

  private function generateTokenAndCookie($user)
  {
    $token = JWTAuth::fromUser($user);

    $cookie = cookie(
      'token',               // name
      $token,                // value
      config('jwt.ttl'),     // minutes (from JWT config)
      '/',                   // path
      null,                  // domain (null = current domain)
      true,                  // secure (HTTPS only)
      true,                  // httpOnly (prevent XSS)
      false,                 // raw
      'strict'               // sameSite
    );

    return [
      'token' => $token,
      'cookie' => $cookie
    ];
  }

  private function createSuccessResponse($token, $user, $cookie)
  {
    return [
      'code' => HttpCode::SUCCESS,
      'status' => true,
      'msgCode' => MsgCode::LOGIN_SUCCESS,
      'message' => 'Đăng nhập thành công',
      'data' => [
        'access_token' => $token,
        'user' => $user,
      ],
      'cookie' => $cookie
    ];
  }
}
