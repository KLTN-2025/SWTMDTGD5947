<?php

namespace App\services;

use App\Helper\Constants;
use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\AuthProvider;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Exception;

class UserService
{
    protected $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function getAllUsers($request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $users = User::with(['role', 'profile'])
                ->orderBy('createdAt', 'desc')
                ->paginate($perPage);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách người dùng thành công',
                'data' => [
                    'users' => $users->items(),
                    'pagination' => [
                        'total' => $users->total(),
                        'per_page' => $users->perPage(),
                        'current_page' => $users->currentPage(),
                        'last_page' => $users->lastPage(),
                        'from' => $users->firstItem(),
                        'to' => $users->lastItem(),
                    ]
                ]
            ];
        } catch (Exception $e) {
            Log::error('Get all users failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách người dùng thất bại',
            ];
        }
    }

    public function getUserById($id)
    {
        $validationResult = $this->validateUserId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $userResult = $this->findUser($id);
        if (!$userResult['isFound']) {
            return $userResult['response'];
        }

        // Lấy thông tin auth provider
        $user = $userResult['user'];
        $authProvider = AuthProvider::where('userId', $user->id)
            ->where('provider', 'LOCAL')
            ->first();

        $userData = $user->toArray();
        $userData['hasPassword'] = $authProvider ? true : false;
        $userData['provider'] = $authProvider ? $authProvider->provider : null;

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Lấy thông tin người dùng thành công',
            'data' => $userData
        ];
    }

    public function createUser($request)
    {
        $validationResult = $this->validateUserData($request);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $emailCheckResult = $this->checkEmailExists($validationResult['data']['email']);
        if (!$emailCheckResult['isAvailable']) {
            return $emailCheckResult['response'];
        }

        $userNameCheckResult = $this->checkUserNameExists($validationResult['data']['userName']);
        if (!$userNameCheckResult['isAvailable']) {
            return $userNameCheckResult['response'];
        }

        $createResult = $this->performCreateUser($validationResult['data'], $request);
        if (!$createResult['isCreated']) {
            return $createResult['response'];
        }

        return $createResult['response'];
    }

    public function updateUser($id, $request)
    {
        $validationResult = $this->validateUserId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $userResult = $this->findUser($id);
        if (!$userResult['isFound']) {
            return $userResult['response'];
        }

        $validationDataResult = $this->validateUserData($request, $id);
        if (!$validationDataResult['isValid']) {
            return $validationDataResult['response'];
        }

        $updateResult = $this->performUpdateUser($userResult['user'], $validationDataResult['data'], $request);
        if (!$updateResult['isUpdated']) {
            return $updateResult['response'];
        }

        return $updateResult['response'];
    }

    public function deleteUser($id, $currentUser = null)
    {
        $validationResult = $this->validateUserId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $userResult = $this->findUser($id);
        if (!$userResult['isFound']) {
            return $userResult['response'];
        }

        $userToDelete = $userResult['user'];

        // Get current user from auth if not provided
        if (!$currentUser) {
            $currentUser = auth('api')->user();
        }

        // Check if current user exists
        if (!$currentUser) {
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::UNAUTHORIZED,
                    'status' => false,
                    'msgCode' => MsgCode::UNAUTHORIZED,
                    'message' => 'Bạn chưa đăng nhập',
                ]
            ];
        }

        // Load role relationship
        $currentUser->load('role');
        $userToDelete->load('role');

        // Check if trying to delete self
        if ($currentUser->id === $userToDelete->id) {
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Bạn không thể xóa chính mình',
                ]
            ];
        }

        // Check if trying to delete an admin
        if ($userToDelete->role && $userToDelete->role->name === Constants::ADMIN) {
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::FORBIDDEN,
                    'status' => false,
                    'msgCode' => MsgCode::FORBIDDEN,
                    'message' => 'Không tự ý khoá ADMIN',
                ]
            ];
        }

        $deleteResult = $this->performDeleteUser($userToDelete);
        if (!$deleteResult['isDeleted']) {
            return $deleteResult['response'];
        }

        return $deleteResult['response'];
    }

    public function searchUsers($request)
    {
        $validationResult = $this->validateSearchParams($request);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $searchResult = $this->performSearch($validationResult['data']);
        if (!$searchResult['isSuccess']) {
            return $searchResult['response'];
        }

        return $searchResult['response'];
    }

    private function validateSearchParams($request)
    {
        $validator = Validator::make($request->all(), [
            'keyword' => 'nullable|string|max:255',
            'role_id' => 'nullable|integer|exists:roles,id',
            'is_active' => 'nullable|boolean',
            'sort_by' => 'nullable|in:name,email,createdAt',
            'sort_order' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
        ], [
            'keyword.string' => 'Từ khóa tìm kiếm phải là chuỗi ký tự.',
            'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá :max ký tự.',
            'role_id.integer' => 'ID vai trò phải là số nguyên.',
            'role_id.exists' => 'Vai trò không tồn tại.',
            'is_active.boolean' => 'Trạng thái hoạt động phải là true/false.',
            'sort_by.in' => 'Trường sắp xếp không hợp lệ.',
            'sort_order.in' => 'Thứ tự sắp xếp không hợp lệ.',
            'per_page.integer' => 'Số lượng người dùng trên trang phải là số nguyên.',
            'per_page.min' => 'Số lượng người dùng trên trang phải lớn hơn 0.',
            'per_page.max' => 'Số lượng người dùng trên trang không được vượt quá :max.',
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

        return [
            'isValid' => true,
            'data' => $validator->validated()
        ];
    }

    private function performSearch($data)
    {
        try {
            $query = User::query()->with(['role', 'profile']);

            // Tìm kiếm theo từ khóa
            if (!empty($data['keyword'])) {
                $keyword = $data['keyword'];
                $query->where(function ($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%")
                        ->orWhere('userName', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%");
                });
            }

            // Lọc theo vai trò
            if (!empty($data['role_id'])) {
                $query->where('roleId', $data['role_id']);
            }

            // Lọc theo trạng thái hoạt động
            if (isset($data['is_active'])) {
                $query->where('isActive', $data['is_active']);
            }

            // Sắp xếp
            $sortBy = $data['sort_by'] ?? 'createdAt';
            $sortOrder = $data['sort_order'] ?? 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // Phân trang
            $perPage = $data['per_page'] ?? 15;
            $users = $query->paginate($perPage);

            return [
                'isSuccess' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Tìm kiếm người dùng thành công',
                    'data' => [
                        'users' => $users->items(),
                        'pagination' => [
                            'total' => $users->total(),
                            'per_page' => $users->perPage(),
                            'current_page' => $users->currentPage(),
                            'last_page' => $users->lastPage(),
                            'from' => $users->firstItem(),
                            'to' => $users->lastItem(),
                        ]
                    ]
                ]
            ];
        } catch (Exception $e) {
            Log::error('User search failed: ' . $e->getMessage());
            return [
                'isSuccess' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Tìm kiếm người dùng thất bại',
                ]
            ];
        }
    }

    private function validateUserId($id)
    {
        $validator = Validator::make(['id' => $id], [
            'id' => 'required|integer|min:1',
        ], [
            'id.required' => 'ID người dùng là bắt buộc.',
            'id.integer' => 'ID người dùng phải là số nguyên.',
            'id.min' => 'ID người dùng không hợp lệ.',
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

    private function findUser($id)
    {
        try {
            $user = User::with(['role', 'profile'])->find($id);

            if (!$user) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Người dùng không tồn tại',
                    ]
                ];
            }

            return [
                'isFound' => true,
                'user' => $user
            ];
        } catch (Exception $e) {
            Log::error('Find user failed: ' . $e->getMessage());
            return [
                'isFound' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi tìm người dùng',
                ]
            ];
        }
    }

    private function validateUserData($request, $userId = null)
    {
        $rules = [
            'name' => 'required|string|max:50',
            'userName' => 'required|string|max:50',
            'email' => 'required|email|max:50',
            'password' => $userId ? 'nullable|string|min:6' : 'nullable|string|min:6',
            'roleId' => 'required|integer|exists:roles,id',
            'isActive' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'dateOfBirth' => 'nullable|date',
        ];

        // Nếu là update, cho phép email và userName trùng với chính nó
        if ($userId) {
            $rules['email'] = 'required|email|max:50|unique:users,email,' . $userId;
            $rules['userName'] = 'required|string|max:50|unique:users,userName,' . $userId;
        } else {
            $rules['email'] = 'required|email|max:50|unique:users,email';
            $rules['userName'] = 'required|string|max:50|unique:users,userName';
        }

        $validator = Validator::make($request->all(), $rules, [
            'name.required' => 'Tên người dùng là bắt buộc.',
            'name.max' => 'Tên người dùng không được vượt quá :max ký tự.',
            'userName.required' => 'Tên đăng nhập là bắt buộc.',
            'userName.unique' => 'Tên đăng nhập đã tồn tại.',
            'userName.max' => 'Tên đăng nhập không được vượt quá :max ký tự.',
            'email.required' => 'Email là bắt buộc.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email đã tồn tại.',
            'email.max' => 'Email không được vượt quá :max ký tự.',
            'password.min' => 'Mật khẩu phải có ít nhất :min ký tự.',
            'roleId.required' => 'Vai trò là bắt buộc.',
            'roleId.integer' => 'Vai trò phải là số nguyên.',
            'roleId.exists' => 'Vai trò không tồn tại.',
            'isActive.boolean' => 'Trạng thái hoạt động phải là true/false.',
            'image.image' => 'File phải là ảnh.',
            'image.mimes' => 'Ảnh phải có định dạng: jpeg, png, jpg, gif, webp.',
            'image.max' => 'Kích thước ảnh không được vượt quá 2MB.',
            'phone.max' => 'Số điện thoại không được vượt quá :max ký tự.',
            'address.max' => 'Địa chỉ không được vượt quá :max ký tự.',
            'dateOfBirth.date' => 'Ngày sinh không hợp lệ.',
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

        return [
            'isValid' => true,
            'data' => $validator->validated()
        ];
    }

    private function checkEmailExists($email)
    {
        $exists = User::where('email', $email)->exists();

        if ($exists) {
            return [
                'isAvailable' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Email đã tồn tại',
                ]
            ];
        }

        return ['isAvailable' => true];
    }

    private function checkUserNameExists($userName)
    {
        $exists = User::where('userName', $userName)->exists();

        if ($exists) {
            return [
                'isAvailable' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Tên đăng nhập đã tồn tại',
                ]
            ];
        }

        return ['isAvailable' => true];
    }

    private function performCreateUser($data, $request)
    {
        try {
            $user = DB::transaction(function () use ($data, $request) {
                // Xử lý upload ảnh
                $imageUrl = null;
                if ($request->hasFile('image')) {
                    $imageUrl = $this->handleImageUpload($request->file('image'));
                }

                // Tạo người dùng (KHÔNG có password)
                $user = User::create([
                    'name' => $data['name'],
                    'userName' => $data['userName'],
                    'email' => $data['email'],
                    'roleId' => $data['roleId'],
                    'isActive' => $data['isActive'] ?? true,
                    'imageUrl' => $imageUrl,
                ]);

                // Tạo profile
                UserProfile::create([
                    'userId' => $user->id,
                    'phoneNumber' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                    'dateOfBirth' => $data['dateOfBirth'] ?? null,
                ]);

                // Tạo auth provider với password (nếu có)
                if (!empty($data['password'])) {
                    AuthProvider::create([
                        'userId' => $user->id,
                        'provider' => 'LOCAL',
                        'password' => bcrypt($data['password']),
                        'providerId' => null,
                    ]);
                }

                return $user->load(['role', 'profile']);
            });

            return [
                'isCreated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Tạo người dùng thành công',
                    'data' => $user
                ]
            ];
        } catch (Exception $e) {
            Log::error('Create user failed: ' . $e->getMessage());
            return [
                'isCreated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Tạo người dùng thất bại: ' . $e->getMessage(),
                ]
            ];
        }
    }

    private function performUpdateUser($user, $data, $request)
    {
        try {
            DB::transaction(function () use ($user, $data, $request) {
                // Xử lý upload ảnh mới
                $imageUrl = $user->imageUrl;
                if ($request->hasFile('image')) {
                    // Xóa ảnh cũ nếu có
                    if ($user->imageUrl) {
                        $this->deleteImage($user->imageUrl);
                    }
                    $imageUrl = $this->handleImageUpload($request->file('image'));
                }

                $user->update([
                    'name' => $data['name'],
                    'userName' => $data['userName'],
                    'email' => $data['email'],
                    'roleId' => $data['roleId'],
                    'isActive' => $data['isActive'] ?? $user->isActive,
                    'imageUrl' => $imageUrl,
                ]);

                $profileData = [
                    'phoneNumber' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                ];

                if ($user->profile) {
                    $user->profile->update($profileData);
                } else {
                    UserProfile::create(array_merge($profileData, ['userId' => $user->id]));
                }

                if (!empty($data['password'])) {
                    $authProvider = AuthProvider::where('userId', $user->id)
                        ->where('provider', 'LOCAL')
                        ->first();

                    if ($authProvider) {
                        // Cập nhật password hiện có
                        $authProvider->update([
                            'password' => bcrypt($data['password'])
                        ]);
                    } else {
                        // Tạo mới auth provider nếu chưa có
                        AuthProvider::create([
                            'userId' => $user->id,
                            'provider' => 'LOCAL',
                            'password' => bcrypt($data['password']),
                            'providerId' => null,
                        ]);
                    }
                }
            });

            $user->refresh()->load(['role', 'profile']);
            return [
                'isUpdated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Cập nhật người dùng thành công',
                    'data' => $user
                ]
            ];
        } catch (Exception $e) {
            Log::error('Update user failed: ' . $e->getMessage());
            return [
                'isUpdated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Cập nhật người dùng thất bại: ' . $e->getMessage(),
                ]
            ];
        }
    }

    private function performDeleteUser($user)
    {
        try {
            DB::transaction(function () use ($user) {
                // Xóa ảnh nếu có
                if ($user->imageUrl) {
                    $this->deleteImage($user->imageUrl);
                }

                // Xóa người dùng (soft delete)
                $user->delete();
            });

            return [
                'isDeleted' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Xóa người dùng thành công',
                ]
            ];
        } catch (Exception $e) {
            Log::error('Delete user failed: ' . $e->getMessage());
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Xóa người dùng thất bại',
                ]
            ];
        }
    }

    private function handleImageUpload($image)
    {
        // Tạo tên file unique
        $fileName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();

        // Lưu file vào thư mục public/users
        $image->move(public_path('users'), $fileName);

        // Trả về đường dẫn
        return 'users/' . $fileName;
    }

    private function deleteImage($imageUrl)
    {
        $imagePath = public_path($imageUrl);
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }
    }
}
