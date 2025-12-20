<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\AuthProvider;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileService
{
  protected $userModel;
  protected $profileModel;

  public function __construct()
  {
    $this->userModel = new User();
    $this->profileModel = new UserProfile();
  }

  public function getProfile($userId)
  {
    try {
      $user = User::with(['profile', 'role'])->find($userId);

      if (!$user) {
        return [
          'code' => HttpCode::NOT_FOUND,
          'status' => false,
          'msgCode' => MsgCode::NOT_FOUND,
          'message' => 'Người dùng không tồn tại'
        ];
      }

      return [
        'code' => HttpCode::SUCCESS,
        'status' => true,
        'msgCode' => MsgCode::SUCCESS,
        'message' => 'Lấy thông tin cá nhân thành công',
        'data' => [
          'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'userName' => $user->userName,
            'email' => $user->email,
            'imageUrl' => $user->imageUrl,
            'isActive' => $user->isActive,
            'role' => $user->role->name ?? null,
          ],
          'profile' => [
            'address' => $user->profile->address ?? null,
            'phoneNumber' => $user->profile->phoneNumber ?? null,
          ]
        ]
      ];
    } catch (Exception $e) {
      Log::error('Get profile failed: ' . $e->getMessage());
      return [
        'code' => HttpCode::SERVER_ERROR,
        'status' => false,
        'msgCode' => MsgCode::SERVER_ERROR,
        'message' => 'Lấy thông tin thất bại'
      ];
    }
  }

  public function updateProfile($request, $userId)
  {
    $validationResult = $this->validateUpdateProfile($request);
    if (!$validationResult['isValid']) {
      return $validationResult['response'];
    }

    $userResult = $this->checkUserExists($userId);
    if (!$userResult['exists']) {
      return $userResult['response'];
    }

    $updateResult = $this->performUpdate($request, $userResult['user']);
    return $updateResult;
  }

  private function validateUpdateProfile($request)
  {
    $validator = Validator::make(
      $request->all(),
      [
        'name' => 'nullable|string|max:50',
        'userName' => 'nullable|string|max:50',
        'address' => 'nullable|string|max:255',
        'phoneNumber' => 'nullable|string|max:15',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
      ],
      [
        'name.string' => 'Tên phải là chuỗi ký tự.',
        'name.max' => 'Tên không được vượt quá 50 ký tự.',
        'userName.string' => 'Tên đăng nhập phải là chuỗi ký tự.',
        'userName.max' => 'Tên đăng nhập không được vượt quá 50 ký tự.',
        'address.string' => 'Địa chỉ phải là chuỗi ký tự.',
        'address.max' => 'Địa chỉ không được vượt quá 255 ký tự.',
        'phoneNumber.string' => 'Số điện thoại phải là chuỗi ký tự.',
        'phoneNumber.max' => 'Số điện thoại không được vượt quá 15 ký tự.',
        'image.image' => 'File phải là ảnh.',
        'image.mimes' => 'Ảnh phải có định dạng: jpeg, png, jpg, gif.',
        'image.max' => 'Ảnh không được vượt quá 2MB.',
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

    return ['isValid' => true];
  }

  private function checkUserExists($userId)
  {
    $user = User::with('profile')->find($userId);

    if (!$user) {
      return [
        'exists' => false,
        'response' => [
          'code' => HttpCode::NOT_FOUND,
          'status' => false,
          'msgCode' => MsgCode::NOT_FOUND,
          'message' => 'Người dùng không tồn tại'
        ]
      ];
    }

    return [
      'exists' => true,
      'user' => $user
    ];
  }

  private function performUpdate($request, $user)
  {
    try {
      DB::beginTransaction();

      $imageUrl = $user->imageUrl;
      if ($request->hasFile('image')) {
        $imageResult = $this->handleImageUpload($request->file('image'), $user->imageUrl);
        if (!$imageResult['success']) {
          DB::rollBack();
          return $imageResult['response'];
        }
        $imageUrl = $imageResult['imageUrl'];
      }

      if ($request->filled('name')) {
        $user->name = $request->name;
      }

      if ($request->filled('userName')) {
        $existingUser = User::where('userName', $request->userName)
          ->where('id', '!=', $user->id)
          ->first();

        if ($existingUser) {
          DB::rollBack();
          return [
            'code' => HttpCode::BAD_REQUEST,
            'status' => false,
            'msgCode' => MsgCode::BAD_REQUEST,
            'message' => 'Tên đăng nhập đã tồn tại'
          ];
        }

        $user->userName = $request->userName;
      }

      if ($imageUrl !== $user->imageUrl) {
        $user->imageUrl = $imageUrl;
      }

      $user->save();

      if ($request->filled('address') || $request->filled('phoneNumber')) {
        $profile = $user->profile;
        if (!$profile) {
          $profile = new UserProfile();
          $profile->userId = $user->id;
        }

        if ($request->filled('address')) {
          $profile->address = $request->address;
        }

        if ($request->filled('phoneNumber')) {
          $profile->phoneNumber = $request->phoneNumber;
        }

        $profile->save();
      }

      DB::commit();

      $updatedUser = User::with(['profile', 'role'])->find($user->id);

      return [
        'code' => HttpCode::SUCCESS,
        'status' => true,
        'msgCode' => MsgCode::SUCCESS,
        'message' => 'Cập nhật thông tin thành công',
        'data' => [
          'user' => [
            'id' => $updatedUser->id,
            'name' => $updatedUser->name,
            'userName' => $updatedUser->userName,
            'email' => $updatedUser->email,
            'imageUrl' => $updatedUser->imageUrl,
            'isActive' => $updatedUser->isActive,
            'role' => $updatedUser->role->name ?? null,
          ],
          'profile' => [
            'address' => $updatedUser->profile->address ?? null,
            'phoneNumber' => $updatedUser->profile->phoneNumber ?? null,
          ]
        ]
      ];
    } catch (Exception $e) {
      DB::rollBack();
      Log::error('Update profile failed: ' . $e->getMessage());
      return [
        'code' => HttpCode::SERVER_ERROR,
        'status' => false,
        'msgCode' => MsgCode::SERVER_ERROR,
        'message' => 'Cập nhật thông tin thất bại'
      ];
    }
  }

  private function handleImageUpload($image, $oldImageUrl)
  {
    try {
      if ($oldImageUrl) {
        $oldImagePath = str_replace('/storage/', '', $oldImageUrl);
        if (Storage::disk('public')->exists($oldImagePath)) {
          Storage::disk('public')->delete($oldImagePath);
        }
      }

      $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
      $imagePath = $image->storeAs('images/profiles', $imageName, 'public');

      return [
        'success' => true,
        'imageUrl' => '/storage/' . $imagePath
      ];
    } catch (Exception $e) {
      Log::error('Image upload failed: ' . $e->getMessage());
      return [
        'success' => false,
        'response' => [
          'code' => HttpCode::SERVER_ERROR,
          'status' => false,
          'msgCode' => MsgCode::SERVER_ERROR,
          'message' => 'Upload ảnh thất bại'
        ]
      ];
    }
  }

  public function changePassword($request, $userId)
  {
    $validationResult = $this->validateChangePassword($request);
    if (!$validationResult['isValid']) {
      return $validationResult['response'];
    }

    $userResult = $this->checkUserExists($userId);
    if (!$userResult['exists']) {
      return $userResult['response'];
    }

    $changeResult = $this->performChangePassword($request, $userResult['user']);
    return $changeResult;
  }

  private function validateChangePassword($request)
  {
    $validator = Validator::make(
      $request->all(),
      [
        'currentPassword' => 'required|string|min:6',
        'newPassword' => 'required|string|min:6|max:50',
        'confirmPassword' => 'required|same:newPassword',
      ],
      [
        'currentPassword.required' => 'Vui lòng nhập mật khẩu hiện tại.',
        'currentPassword.min' => 'Mật khẩu hiện tại phải có ít nhất 6 ký tự.',
        'newPassword.required' => 'Vui lòng nhập mật khẩu mới.',
        'newPassword.min' => 'Mật khẩu mới phải có ít nhất 6 ký tự.',
        'newPassword.max' => 'Mật khẩu mới không được vượt quá 50 ký tự.',
        'confirmPassword.required' => 'Vui lòng nhập lại mật khẩu xác nhận.',
        'confirmPassword.same' => 'Mật khẩu xác nhận không khớp.',
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

    return ['isValid' => true];
  }

  private function performChangePassword($request, $user)
  {
    try {
      $authProvider = AuthProvider::where('userId', $user->id)
        ->where('provider', 'LOCAL')
        ->first();

      if (!$authProvider) {
        return [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::BAD_REQUEST,
          'message' => 'Tài khoản không hỗ trợ đổi mật khẩu (đăng nhập qua mạng xã hội)'
        ];
      }

      if (!Hash::check($request->currentPassword, $authProvider->password)) {
        return [
          'code' => HttpCode::BAD_REQUEST,
          'status' => false,
          'msgCode' => MsgCode::BAD_REQUEST,
          'message' => 'Mật khẩu hiện tại không đúng'
        ];
      }

      $authProvider->password = bcrypt($request->newPassword);
      $authProvider->save();

      return [
        'code' => HttpCode::SUCCESS,
        'status' => true,
        'msgCode' => MsgCode::SUCCESS,
        'message' => 'Đổi mật khẩu thành công'
      ];
    } catch (Exception $e) {
      Log::error('Change password failed: ' . $e->getMessage());
      return [
        'code' => HttpCode::SERVER_ERROR,
        'status' => false,
        'msgCode' => MsgCode::SERVER_ERROR,
        'message' => 'Đổi mật khẩu thất bại'
      ];
    }
  }
}
