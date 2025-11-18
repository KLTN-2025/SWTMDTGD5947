<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Helper\Constants;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Role;
use App\Models\Order;
use App\Models\Cart;
use App\Models\Review;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Exception;

class CustomerService
{
    protected $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Lấy danh sách khách hàng (users có role USER)
     */
    public function getAllCustomers($request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $isActive = $request->input('is_active');
            $minSpent = $request->input('min_spent');
            $maxSpent = $request->input('max_spent');
            $minOrders = $request->input('min_orders');
            $maxOrders = $request->input('max_orders');
            $sortBy = $request->input('sort_by', 'createdAt');
            $sortOrder = $request->input('sort_order', 'desc');

            // Lấy role USER
            $userRole = Role::where('name', Constants::USER)->first();
            if (!$userRole) {
                return [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Không tìm thấy role USER',
                ];
            }

            $query = User::with(['role', 'profile'])
                ->where('roleId', $userRole->id);

            // Tìm kiếm
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('userName', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('profile', function ($profileQuery) use ($search) {
                            $profileQuery->where('phoneNumber', 'like', "%{$search}%")
                                ->orWhere('address', 'like', "%{$search}%");
                        });
                });
            }

            // Lọc theo trạng thái
            if ($isActive !== null && $isActive !== '') {
                $query->where('isActive', $isActive);
            }

            // Lấy tất cả customers trước để tính toán thống kê
            $allCustomers = $query->get();

            // Thêm thống kê cho mỗi customer
            $allCustomers->transform(function ($customer) {
                $customer->totalOrders = Order::where('userId', $customer->id)->count();
                $customer->totalSpent = Order::where('userId', $customer->id)->sum('amount');
                $customer->totalReviews = Review::where('userId', $customer->id)->count();
                return $customer;
            });

            // Lọc theo tổng chi tiêu
            if ($minSpent !== null && $minSpent !== '') {
                $allCustomers = $allCustomers->filter(function ($customer) use ($minSpent) {
                    return $customer->totalSpent >= floatval($minSpent);
                });
            }
            if ($maxSpent !== null && $maxSpent !== '') {
                $allCustomers = $allCustomers->filter(function ($customer) use ($maxSpent) {
                    return $customer->totalSpent <= floatval($maxSpent);
                });
            }

            // Lọc theo số lượng đơn hàng
            if ($minOrders !== null && $minOrders !== '') {
                $allCustomers = $allCustomers->filter(function ($customer) use ($minOrders) {
                    return $customer->totalOrders >= intval($minOrders);
                });
            }
            if ($maxOrders !== null && $maxOrders !== '') {
                $allCustomers = $allCustomers->filter(function ($customer) use ($maxOrders) {
                    return $customer->totalOrders <= intval($maxOrders);
                });
            }

            // Sắp xếp
            if ($sortBy === 'totalSpent') {
                if ($sortOrder === 'desc') {
                    $allCustomers = $allCustomers->sortByDesc('totalSpent');
                } else {
                    $allCustomers = $allCustomers->sortBy('totalSpent');
                }
            } elseif ($sortBy === 'totalOrders') {
                if ($sortOrder === 'desc') {
                    $allCustomers = $allCustomers->sortByDesc('totalOrders');
                } else {
                    $allCustomers = $allCustomers->sortBy('totalOrders');
                }
            } else {
                if ($sortOrder === 'desc') {
                    $allCustomers = $allCustomers->sortByDesc($sortBy);
                } else {
                    $allCustomers = $allCustomers->sortBy($sortBy);
                }
            }

            // Phân trang thủ công
            $total = $allCustomers->count();
            $currentPage = $request->input('page', 1);
            $offset = ($currentPage - 1) * $perPage;
            $customers = $allCustomers->slice($offset, $perPage)->values();

            $lastPage = ceil($total / $perPage);
            $from = $total > 0 ? $offset + 1 : null;
            $to = min($offset + $perPage, $total);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách khách hàng thành công',
                'data' => [
                    'customers' => $customers->toArray(),
                    'pagination' => [
                        'total' => $total,
                        'per_page' => $perPage,
                        'current_page' => intval($currentPage),
                        'last_page' => $lastPage,
                        'from' => $from,
                        'to' => $to > 0 ? $to : null,
                    ]
                ]
            ];
        } catch (Exception $e) {
            Log::error('Get all customers failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách khách hàng thất bại',
            ];
        }
    }

    /**
     * Lấy chi tiết khách hàng
     */
    public function getCustomerById($id)
    {
        $validationResult = $this->validateCustomerId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $customerResult = $this->findCustomer($id);
        if (!$customerResult['isFound']) {
            return $customerResult['response'];
        }

        $customer = $customerResult['customer'];

        // Thêm thống kê
        $customer->totalOrders = Order::where('userId', $customer->id)->count();
        $customer->totalSpent = Order::where('userId', $customer->id)->sum('amount');
        $customer->totalReviews = Review::where('userId', $customer->id)->count();
        $customer->totalCartItems = Cart::where('userId', $customer->id)
            ->withCount('items')
            ->first()
            ?->items_count ?? 0;

        // Lấy danh sách đơn hàng gần đây
        $recentOrders = Order::where('userId', $customer->id)
            ->with([
                'items.productVariant.product:id,name,skuId,basePrice',
                'items.productVariant.product.images:id,productId,url',
                'items.productVariant.size:id,nameSize',
                'items.color:id,name,hexCode'
            ])
            ->orderBy('createdAt', 'desc')
            ->limit(10)
            ->get();

        // Transform orders để có đầy đủ thông tin
        $customer->recentOrders = $recentOrders->map(function ($order) {
            $transformedItems = $order->items->map(function ($item) {
                $product = $item->productVariant->product;
                $mainImage = $product->images->first();
                
                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'itemTotal' => $item->quantity * $item->productVariant->price,
                    'mainImage' => $mainImage ? url($mainImage->url) : null,
                    'productVariant' => [
                        'id' => $item->productVariant->id,
                        'price' => $item->productVariant->price,
                        'product' => [
                            'id' => $product->id,
                            'name' => $product->name,
                            'skuId' => $product->skuId,
                            'basePrice' => $product->basePrice,
                            'images' => $product->images->map(function ($image) {
                                return [
                                    'id' => $image->id,
                                    'productId' => $image->productId,
                                    'url' => $image->url,
                                    'fullUrl' => url($image->url),
                                ];
                            }),
                        ],
                        'size' => $item->productVariant->size ? [
                            'id' => $item->productVariant->size->id,
                            'nameSize' => $item->productVariant->size->nameSize,
                        ] : null,
                    ],
                    'color' => $item->color ? [
                        'id' => $item->color->id,
                        'name' => $item->color->name,
                        'hexCode' => $item->color->hexCode,
                    ] : null,
                ];
            });

            return [
                'id' => $order->id,
                'status' => $order->status,
                'amount' => $order->amount,
                'createdAt' => $order->createdAt,
                'updatedAt' => $order->updatedAt,
                'items' => $transformedItems,
            ];
        });

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Lấy thông tin khách hàng thành công',
            'data' => $customer
        ];
    }

    /**
     * Tạo khách hàng mới
     */
    public function createCustomer($request)
    {
        $validationResult = $this->validateCustomerData($request);
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

        $createResult = $this->performCreateCustomer($validationResult['data'], $request);
        if (!$createResult['isCreated']) {
            return $createResult['response'];
        }

        return $createResult['response'];
    }

    /**
     * Cập nhật khách hàng
     */
    public function updateCustomer($id, $request)
    {
        $validationResult = $this->validateCustomerId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $customerResult = $this->findCustomer($id);
        if (!$customerResult['isFound']) {
            return $customerResult['response'];
        }

        $dataValidationResult = $this->validateCustomerData($request, $id);
        if (!$dataValidationResult['isValid']) {
            return $dataValidationResult['response'];
        }

        $updateResult = $this->performUpdateCustomer($customerResult['customer'], $dataValidationResult['data'], $request);
        if (!$updateResult['isUpdated']) {
            return $updateResult['response'];
        }

        return $updateResult['response'];
    }

    /**
     * Xóa khách hàng (soft delete)
     */
    public function deleteCustomer($id)
    {
        $validationResult = $this->validateCustomerId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $customerResult = $this->findCustomer($id);
        if (!$customerResult['isFound']) {
            return $customerResult['response'];
        }

        $deleteResult = $this->performDeleteCustomer($customerResult['customer']);
        if (!$deleteResult['isDeleted']) {
            return $deleteResult['response'];
        }

        return $deleteResult['response'];
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    private function validateCustomerId($id)
    {
        $validator = Validator::make(['id' => $id], [
            'id' => 'required|integer|min:1',
        ], [
            'id.required' => 'ID khách hàng là bắt buộc.',
            'id.integer' => 'ID khách hàng phải là số nguyên.',
            'id.min' => 'ID khách hàng không hợp lệ.',
        ]);

        if ($validator->fails()) {
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => $validator->errors()->first(),
                ]
            ];
        }

        return ['isValid' => true];
    }

    private function findCustomer($id)
    {
        try {
            // Lấy role USER
            $userRole = Role::where('name', Constants::USER)->first();
            if (!$userRole) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::SERVER_ERROR,
                        'status' => false,
                        'msgCode' => MsgCode::SERVER_ERROR,
                        'message' => 'Không tìm thấy role USER',
                    ]
                ];
            }

            $customer = User::with(['role', 'profile'])
                ->where('id', $id)
                ->where('roleId', $userRole->id)
                ->first();

            if (!$customer) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Khách hàng không tồn tại',
                    ]
                ];
            }

            return [
                'isFound' => true,
                'customer' => $customer
            ];
        } catch (Exception $e) {
            Log::error('Find customer failed: ' . $e->getMessage());
            return [
                'isFound' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi tìm khách hàng',
                ]
            ];
        }
    }

    private function validateCustomerData($request, $customerId = null)
    {
        $rules = [
            'name' => 'required|string|max:50',
            'userName' => 'required|string|max:50',
            'email' => 'required|email|max:50',
            'password' => $customerId ? 'nullable|string|min:6' : 'nullable|string|min:6',
            'isActive' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'phoneNumber' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
        ];

        // Nếu là update, cho phép email và userName trùng với chính nó
        if ($customerId) {
            $rules['email'] = 'required|email|max:50|unique:users,email,' . $customerId;
            $rules['userName'] = 'required|string|max:50|unique:users,userName,' . $customerId;
        } else {
            $rules['email'] = 'required|email|max:50|unique:users,email';
            $rules['userName'] = 'required|string|max:50|unique:users,userName';
        }

        $validator = Validator::make($request->all(), $rules, [
            'name.required' => 'Tên khách hàng là bắt buộc.',
            'name.max' => 'Tên khách hàng không được vượt quá :max ký tự.',
            'userName.required' => 'Tên đăng nhập là bắt buộc.',
            'userName.unique' => 'Tên đăng nhập đã tồn tại.',
            'userName.max' => 'Tên đăng nhập không được vượt quá :max ký tự.',
            'email.required' => 'Email là bắt buộc.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email đã tồn tại.',
            'email.max' => 'Email không được vượt quá :max ký tự.',
            'password.min' => 'Mật khẩu phải có ít nhất :min ký tự.',
            'isActive.boolean' => 'Trạng thái hoạt động phải là true/false.',
            'image.image' => 'File phải là ảnh.',
            'image.mimes' => 'Ảnh phải có định dạng: jpeg, png, jpg, gif, webp.',
            'image.max' => 'Kích thước ảnh không được vượt quá 2MB.',
            'phoneNumber.max' => 'Số điện thoại không được vượt quá :max ký tự.',
            'address.max' => 'Địa chỉ không được vượt quá :max ký tự.',
        ]);

        if ($validator->fails()) {
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::VALIDATION_ERROR,
                    'message' => $validator->errors()->first(),
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

    private function performCreateCustomer($data, $request)
    {
        try {
            $customer = DB::transaction(function () use ($data, $request) {
                // Lấy role USER
                $userRole = Role::where('name', Constants::USER)->first();
                if (!$userRole) {
                    throw new Exception('Không tìm thấy role USER');
                }

                // Xử lý upload ảnh
                $imageUrl = null;
                if ($request->hasFile('image')) {
                    $imageUrl = $this->handleImageUpload($request->file('image'));
                }

                // Tạo khách hàng
                $customer = User::create([
                    'name' => $data['name'],
                    'userName' => $data['userName'],
                    'email' => $data['email'],
                    'roleId' => $userRole->id, // Luôn là role USER
                    'isActive' => $data['isActive'] ?? true,
                    'imageUrl' => $imageUrl,
                ]);

                // Tạo profile
                UserProfile::create([
                    'userId' => $customer->id,
                    'phoneNumber' => $data['phoneNumber'] ?? null,
                    'address' => $data['address'] ?? null,
                ]);

                // Tạo auth provider với password (nếu có)
                if (!empty($data['password'])) {
                    \App\Models\AuthProvider::create([
                        'userId' => $customer->id,
                        'provider' => 'LOCAL',
                        'password' => Hash::make($data['password']),
                        'providerId' => null,
                    ]);
                }

                return $customer->load(['role', 'profile']);
            });

            return [
                'isCreated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Tạo khách hàng thành công',
                    'data' => $customer
                ]
            ];
        } catch (Exception $e) {
            Log::error('Create customer failed: ' . $e->getMessage());
            return [
                'isCreated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Tạo khách hàng thất bại: ' . $e->getMessage(),
                ]
            ];
        }
    }

    private function performUpdateCustomer($customer, $data, $request)
    {
        try {
            DB::transaction(function () use ($customer, $data, $request) {
                // Xử lý upload ảnh mới
                $imageUrl = $customer->imageUrl;
                if ($request->hasFile('image')) {
                    // Xóa ảnh cũ nếu có
                    if ($customer->imageUrl) {
                        $this->deleteImage($customer->imageUrl);
                    }
                    $imageUrl = $this->handleImageUpload($request->file('image'));
                }

                $customer->update([
                    'name' => $data['name'],
                    'userName' => $data['userName'],
                    'email' => $data['email'],
                    'isActive' => $data['isActive'] ?? $customer->isActive,
                    'imageUrl' => $imageUrl,
                ]);

                $profileData = [
                    'phoneNumber' => $data['phoneNumber'] ?? null,
                    'address' => $data['address'] ?? null,
                ];

                if ($customer->profile) {
                    $customer->profile->update($profileData);
                } else {
                    UserProfile::create(array_merge($profileData, ['userId' => $customer->id]));
                }

                // Cập nhật password nếu có
                if (!empty($data['password'])) {
                    $authProvider = \App\Models\AuthProvider::where('userId', $customer->id)
                        ->where('provider', 'LOCAL')
                        ->first();

                    if ($authProvider) {
                        $authProvider->update([
                            'password' => Hash::make($data['password']),
                        ]);
                    } else {
                        \App\Models\AuthProvider::create([
                            'userId' => $customer->id,
                            'provider' => 'LOCAL',
                            'password' => Hash::make($data['password']),
                            'providerId' => null,
                        ]);
                    }
                }
            });

            $customer->refresh()->load(['role', 'profile']);

            return [
                'isUpdated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Cập nhật khách hàng thành công',
                    'data' => $customer
                ]
            ];
        } catch (Exception $e) {
            Log::error('Update customer failed: ' . $e->getMessage());
            return [
                'isUpdated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Cập nhật khách hàng thất bại: ' . $e->getMessage(),
                ]
            ];
        }
    }

    private function performDeleteCustomer($customer)
    {
        try {
            $customer->delete(); // Soft delete

            return [
                'isDeleted' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Xóa khách hàng thành công',
                ]
            ];
        } catch (Exception $e) {
            Log::error('Delete customer failed: ' . $e->getMessage());
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Xóa khách hàng thất bại',
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

