<?php

namespace App\services;

use App\Helper\Constants;
use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Mail\ResetPassMail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuthProvider;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
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

    $isProduction = config('app.env') === 'production';
    // Không set domain cụ thể để cookie hoạt động đúng giữa các port
    // Browser sẽ tự gắn cookie cho origin hiện tại
    $domain = $isProduction ? config('session.domain') : null;
    
    $cookie = cookie(
      'token',               // name
      $token,                // value
      (int) config('jwt.ttl'),     // minutes (from JWT config) - cast to int
      '/',                   // path
      $domain,               // domain - null cho dev để browser tự xử lý
      $isProduction,         // secure (true for production HTTPS)
      true,                  // httpOnly (prevent XSS)
      false,                 // raw
      $isProduction ? 'none' : 'lax'  // sameSite - 'lax' for dev, 'none' for production
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

  public function googleCallBack($informationUser)
  {
    $userResult = $this->userModel->checkUserExsis($informationUser['email']);
    if (!$userResult) {
      try {
        $role = $this->userModel->getRoleByName(Constants::USER);
        $result = DB::transaction(function () use ($informationUser, $role) {
          $user = User::create([
            'name' => $informationUser['name'],
            'userName' => explode('@', $informationUser['email'])[0],
            'email' => $informationUser['email'],
            'isActive' => true,
            'roleId' => $role->id,
          ]);

          $user->profile()->create([
            'userId' => $user->id,
          ]);

          $user->authProvider()->create([
            'userId' => $user->id,
            'provider' => 'GOOGLE',
            'providerId' => $informationUser['sub'],
          ]);

          return $user;
        });

        $tokenData = $this->generateTokenAndCookie($result);
        return [
          'code' => HttpCode::SUCCESS,
          'status' => true,
          'msgCode' => MsgCode::SUCCESS,
          'message' => 'Đăng nhập thành công',
          'data' => [
            'user' => $result,
            'access_token' => $tokenData['token'],
          ],
          'cookie' => $tokenData['cookie']
        ];
      } catch (Exception $e) {
        Log::error($e);
        return [
          'code' => HttpCode::SERVER_ERROR,
          'status' => false,
          'msgCode' => MsgCode::SERVER_ERROR,
          'message' => 'Đăng nhập thất bại'
        ];
      }
    }

    $tokenData = $this->generateTokenAndCookie($userResult);
    return [
      'code' => HttpCode::SUCCESS,
      'status' => true,
      'msgCode' => MsgCode::SUCCESS,
      'message' => 'Đăng nhập thành công',
      'data' => [
        'user' => $userResult,
        'access_token' => $tokenData['token'],
      ],
      'cookie' => $tokenData['cookie']
    ];
  }

  public function sendPasswordResetEmail($email)
  {
    $validator = Validator::make(
      ['email' => $email],
      [
        'email' => 'required|email',
      ],
      [
        'email.required' => 'Vui lòng nhập email.',
        'email.email' => 'Email không hợp lệ.',
      ]
    );

    if ($validator->fails()) {
      return [
        'code' => HttpCode::VALIDATION_ERROR,
        'status' => false,
        'msgCode' => MsgCode::VALIDATION_ERROR,
        'message' => $validator->errors(),
      ];
    }

    $user = $this->userModel->checkUserExsis($email);
    if (!$user) {
      return [
        'code' => HttpCode::NOT_FOUND,
        'status' => false,
        'msgCode' => MsgCode::NOT_FOUND,
        'message' => 'Người dùng không tồn tại'
      ];
    }

    return $this->sendEmail($user);
  }

  private function sendEmail($user)
  {
    try {
      $token = JWTAuth::customClaims([
        'exp' => now()->addMinutes(15)->timestamp,
        'purpose' => 'password_reset'
      ])->fromUser($user);
      $resetLink = config('app.frontend_url') . "/reset-password?token=" . $token;
      Mail::to($user->email)->send(new ResetPassMail($user, $resetLink));

      return [
        'code' => HttpCode::SUCCESS,
        'status' => true,
        'msgCode' => MsgCode::SUCCESS,
        'message' => 'Gửi email thành công tới ' . $user->email
      ];
    } catch (Exception $e) {
      Log::error('Send email failed: ' . $e->getMessage());
      return [
        'code' => HttpCode::BAD_REQUEST,
        'status' => false,
        'msgCode' => MsgCode::BAD_REQUEST,
        'message' => 'Gửi email thất bại'
      ];
    }
  }

  public function resetPassword($request)
  {
    $validator = Validator::make($request->all(), [
      'password' => 'required|string|min:6|max:50',
      're_password' => 'required|same:password',
      'token' => 'required|string',
    ], [
      'password.required' => 'Vui lòng nhập mật khẩu mới',
      'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự',
      'password.max' => 'Mật khẩu không được vượt quá 50 ký tự',
      're_password.required' => 'Vui lòng nhập lại mật khẩu xác nhận',
      're_password.same' => 'Mật khẩu xác nhận không khớp',
      'token.required' => 'Thiếu mã token xác thực',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'code' => 400,
        'status' => false,
        'errors' => $validator->errors(),
      ], 400);
    }

    try {
      $token = $request->token;
      $user = JWTAuth::setToken($token)->authenticate();

      if (!$user) {
        return [
          'code' => HttpCode::UNAUTHORIZED,
          'status' => false,
          'msgCode' => MsgCode::UNAUTHORIZED,
          'message' => 'User không tồn tại'
        ];
      }

      $authProvider = AuthProvider::where('userId', $user->id)->first();
      if (!$authProvider) {
        return [
          'code' => HttpCode::UNAUTHORIZED,
          'status' => false,
          'msgCode' => MsgCode::UNAUTHORIZED,
          'message' => 'Không tìm thấy thông tin đăng nhập user',
        ];
      }

      $authProvider['password'] = bcrypt($request->password);
      $authProvider->save();

      return [
        'code' => HttpCode::SUCCESS,
        'status' => false,
        'msgCode' => MsgCode::SUCCESS,
        'message' => 'Đổi mật khẩu thành công',
        'data' => $authProvider->fresh()
      ];
    } catch (TokenExpiredException $e) {
      Log::error('TokenExpiredException: ' . $e->getMessage());
      return [
        'code' => HttpCode::UNAUTHORIZED,
        'status' => false,
        'msgCode' => MsgCode::UNAUTHORIZED,
        'message' => 'Token không hợp lệ hoặc đã hết hạn'
      ];
    } catch (TokenInvalidException $e) {
      Log::error('TokenInvalidException: ' . $e->getMessage());
      return [
        'code' => HttpCode::UNAUTHORIZED,
        'status' => false,
        'msgCode' => MsgCode::UNAUTHORIZED,
        'message' => 'Token không hợp lệ'
      ];
    } catch (JWTException $e) {
      Log::error('JWTException: ' . $e->getMessage());
      return [
        'code' => HttpCode::UNAUTHORIZED,
        'status' => false,
        'msgCode' => MsgCode::UNAUTHORIZED,
        'message' => 'Token không không tồn tại hoặc lỗi xác thực'
      ];
    }
  }
}
