<?php

namespace App\services;

use App\Helper\Constants;
use App\Helper\HttpCode;
use App\Helper\MsgCode;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuthProvider;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
  protected $userModel;

  public function __construct()
  {
    $this->userModel = new User();
  }

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
      false,                 // secure (HTTPS only)
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

  public function register($request)
  {
    $validationResult = $this->validateRegisterData($request);
    if (!$validationResult['isValid']) {
      return $validationResult['response'];
    }

    $userResult = $this->checkUserExsis($validationResult['data']['email']);
    if (!$userResult['isUser']) {
      return $userResult['response'];
    }

    $createUserResult = $this->createUser($validationResult);
    if (!$createUserResult['isCreate']) {
      return $createUserResult['response'];
    }

    return $createUserResult['response'];
  }

  private function validateRegisterData($request)
  {
    $validator = Validator::make(
      $request->all(),
      [
        'name' => 'required|string|max:255',
        'userName' => 'required|string|max:255',
        'email' => 'required|email',
        'password' => 'required|min:6',
      ],
      [
        'name.required' => 'Vui lòng nhập tên.',
        'userName.required' => 'Vui lòng nhập tên đăng nhập.',
        'email.required' => 'Vui lòng nhập email.',
        'email.email' => 'Email không hợp lệ.',
        'password.required' => 'Vui lòng nhập mật khẩu.',
        'password.min' => 'Mật khẩu phải có ít nhất :min ký tự.',
      ]
    );

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

    return ['isValid' => true, 'data' => $validator->validated()];
  }

  public function checkUserExsis($email)
  {
    $user = $this->userModel->checkUserExsis($email);

    if ($user) {
      return [
        'isUser' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::BAD_REQUEST,
          'message' => 'Email hoặc mật khẩu không đúng',
        ]
      ];
    }

    return ['isUser' => true];
  }

  public function createUser($validationResult)
  {
    $data = [
      'name' => $validationResult['data']['name'],
      'userName' => $validationResult['data']['userName'],
      'email' => $validationResult['data']['email'],
      'password' => bcrypt($validationResult['data']['password']),
    ];

    $data['password'] = bcrypt($data['password']);

    try {
      $user = DB::transaction(function () use ($data) {
        $role = $this->userModel->getRoleByName(Constants::USER);

        $user = User::create([
          'name' => $data['name'],
          'userName' => $data['userName'],
          'email' => $data['email'],
          'isActive' => true,
          'roleId' => $role->id,
        ]);

        $user->profile()->create([
          'userId' => $user->id,
        ]);

        $user->authProvider()->create([
          'provider' => 'LOCAL',
          'password' => $data['password'],
        ]);

        return $user;
      });

      return [
        'isCreate' => true,
        'response' => [
          'code' => HttpCode::SUCCESS,
          'status' => true,
          'msgCode' => MsgCode::SUCCESS,
          'message' => 'Đăng ký thành công',
          'data' => $user
        ]
      ];
    } catch (Exception $e) {
      dd($e);
      Log::error($e);
      return [
        'isCreate' => false,
        'response' => [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::BAD_REQUEST,
          'message' => 'Đăng ký chưa thành công',
        ]
      ];
    }
  }
}
