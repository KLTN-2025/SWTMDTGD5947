<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Category;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class CategoryService
{
    protected $categoryModel;

    public function __construct()
    {
        $this->categoryModel = new Category();
    }

    /**
     * Lấy danh sách tất cả danh mục
     */
    public function getAllCategories($request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $includeChildren = $request->input('include_children', false);
            
            $query = Category::with('parent');
            
            // Nếu yêu cầu bao gồm danh mục con
            if ($includeChildren) {
                $query->with('children');
            }
            
            // Sắp xếp theo thời gian tạo mới nhất
            $categories = $query->orderBy('createdAt', 'desc')->paginate($perPage);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách danh mục thành công',
                'data' => [
                    'categories' => $categories->items(),
                    'pagination' => [
                        'total' => $categories->total(),
                        'per_page' => $categories->perPage(),
                        'current_page' => $categories->currentPage(),
                        'last_page' => $categories->lastPage(),
                        'from' => $categories->firstItem(),
                        'to' => $categories->lastItem(),
                    ]
                ]
            ];
        } catch (Exception $e) {
            Log::error('Get all categories failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách danh mục thất bại',
            ];
        }
    }

    /**
     * Lấy chi tiết danh mục theo ID
     */
    public function getCategoryById($id)
    {
        $validationResult = $this->validateCategoryId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $categoryResult = $this->findCategory($id);
        if (!$categoryResult['isFound']) {
            return $categoryResult['response'];
        }

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Lấy thông tin danh mục thành công',
            'data' => $categoryResult['category']
        ];
    }

    /**
     * Tạo danh mục mới
     */
    public function createCategory($request)
    {
        $validationResult = $this->validateCategoryData($request);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $nameCheckResult = $this->checkNameExists($validationResult['data']['name']);
        if (!$nameCheckResult['isAvailable']) {
            return $nameCheckResult['response'];
        }

        // Kiểm tra parentId nếu có
        if (!empty($validationResult['data']['parentId'])) {
            $parentCheckResult = $this->validateParentCategory($validationResult['data']['parentId']);
            if (!$parentCheckResult['isValid']) {
                return $parentCheckResult['response'];
            }
        }

        $createResult = $this->performCreateCategory($validationResult['data']);
        if (!$createResult['isCreated']) {
            return $createResult['response'];
        }

        return $createResult['response'];
    }

    /**
     * Cập nhật danh mục
     */
    public function updateCategory($id, $request)
    {
        $validationResult = $this->validateCategoryId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $categoryResult = $this->findCategory($id);
        if (!$categoryResult['isFound']) {
            return $categoryResult['response'];
        }

        $validationDataResult = $this->validateCategoryData($request, $id);
        if (!$validationDataResult['isValid']) {
            return $validationDataResult['response'];
        }

        // Kiểm tra parentId nếu có
        if (!empty($validationDataResult['data']['parentId'])) {
            // Không cho phép đặt chính nó làm parent
            if ($validationDataResult['data']['parentId'] == $id) {
                return [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Không thể đặt danh mục làm cha của chính nó',
                ];
            }

            $parentCheckResult = $this->validateParentCategory($validationDataResult['data']['parentId'], $id);
            if (!$parentCheckResult['isValid']) {
                return $parentCheckResult['response'];
            }
        }

        $updateResult = $this->performUpdateCategory($categoryResult['category'], $validationDataResult['data']);
        if (!$updateResult['isUpdated']) {
            return $updateResult['response'];
        }

        return $updateResult['response'];
    }

    /**
     * Xóa danh mục
     */
    public function deleteCategory($id)
    {
        $validationResult = $this->validateCategoryId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $categoryResult = $this->findCategory($id);
        if (!$categoryResult['isFound']) {
            return $categoryResult['response'];
        }

        // Kiểm tra xem danh mục có danh mục con không
        $childrenCheckResult = $this->checkHasChildren($categoryResult['category']);
        if (!$childrenCheckResult['canDelete']) {
            return $childrenCheckResult['response'];
        }

        $deleteResult = $this->performDeleteCategory($categoryResult['category']);
        if (!$deleteResult['isDeleted']) {
            return $deleteResult['response'];
        }

        return $deleteResult['response'];
    }

    /**
     * Validate category ID
     */
    private function validateCategoryId($id)
    {
        $validator = Validator::make(['id' => $id], [
            'id' => 'required|integer|min:1',
        ], [
            'id.required' => 'ID danh mục là bắt buộc.',
            'id.integer' => 'ID danh mục phải là số nguyên.',
            'id.min' => 'ID danh mục không hợp lệ.',
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

    /**
     * Tìm danh mục theo ID
     */
    private function findCategory($id)
    {
        try {
            $category = Category::with(['parent', 'children', 'products'])->find($id);

            if (!$category) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Danh mục không tồn tại',
                    ]
                ];
            }

            return [
                'isFound' => true,
                'category' => $category
            ];
        } catch (Exception $e) {
            Log::error('Find category failed: ' . $e->getMessage());
            return [
                'isFound' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi tìm danh mục',
                ]
            ];
        }
    }

    /**
     * Validate dữ liệu danh mục
     */
    private function validateCategoryData($request, $categoryId = null)
    {
        $rules = [
            'name' => 'required|string|max:50',
            'parentId' => 'nullable|integer|exists:categories,id',
        ];

        // Nếu là update, cho phép name trùng với chính nó
        if ($categoryId) {
            $rules['name'] = 'required|string|max:50|unique:categories,name,' . $categoryId;
        } else {
            $rules['name'] = 'required|string|max:50|unique:categories,name';
        }

        $validator = Validator::make($request->all(), $rules, [
            'name.required' => 'Tên danh mục là bắt buộc.',
            'name.unique' => 'Tên danh mục đã tồn tại.',
            'name.max' => 'Tên danh mục không được vượt quá :max ký tự.',
            'parentId.integer' => 'ID danh mục cha phải là số nguyên.',
            'parentId.exists' => 'Danh mục cha không tồn tại.',
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

    /**
     * Kiểm tra tên danh mục đã tồn tại chưa
     */
    private function checkNameExists($name)
    {
        $exists = Category::where('name', $name)->exists();

        if ($exists) {
            return [
                'isAvailable' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Tên danh mục đã tồn tại',
                ]
            ];
        }

        return ['isAvailable' => true];
    }

    /**
     * Validate danh mục cha
     */
    private function validateParentCategory($parentId, $currentCategoryId = null)
    {
        try {
            $parentCategory = Category::find($parentId);

            if (!$parentCategory) {
                return [
                    'isValid' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Danh mục cha không tồn tại',
                    ]
                ];
            }

            // Nếu đang update, kiểm tra không tạo vòng lặp
            if ($currentCategoryId) {
                $isCircular = $this->checkCircularReference($parentId, $currentCategoryId);
                if ($isCircular) {
                    return [
                        'isValid' => false,
                        'response' => [
                            'code' => HttpCode::BAD_REQUEST,
                            'status' => false,
                            'msgCode' => MsgCode::BAD_REQUEST,
                            'message' => 'Không thể tạo vòng lặp trong cấu trúc danh mục',
                        ]
                    ];
                }
            }

            return ['isValid' => true];
        } catch (Exception $e) {
            Log::error('Validate parent category failed: ' . $e->getMessage());
            return [
                'isValid' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi kiểm tra danh mục cha',
                ]
            ];
        }
    }

    /**
     * Kiểm tra vòng lặp trong cấu trúc danh mục
     */
    private function checkCircularReference($parentId, $categoryId)
    {
        $currentId = $parentId;
        $visited = [];

        while ($currentId) {
            if ($currentId == $categoryId) {
                return true; // Phát hiện vòng lặp
            }

            if (in_array($currentId, $visited)) {
                return true; // Phát hiện vòng lặp
            }

            $visited[] = $currentId;
            $category = Category::find($currentId);
            $currentId = $category ? $category->parentId : null;
        }

        return false;
    }

    /**
     * Kiểm tra danh mục có danh mục con không
     */
    private function checkHasChildren($category)
    {
        $hasChildren = $category->children()->exists();

        if ($hasChildren) {
            return [
                'canDelete' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Không thể xóa danh mục có danh mục con. Vui lòng xóa danh mục con trước.',
                ]
            ];
        }

        return ['canDelete' => true];
    }

    /**
     * Thực hiện tạo danh mục
     */
    private function performCreateCategory($data)
    {
        try {
            $category = DB::transaction(function () use ($data) {
                $category = Category::create([
                    'name' => $data['name'],
                    'parentId' => $data['parentId'] ?? null,
                ]);

                return $category->load(['parent', 'children']);
            });

            return [
                'isCreated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Tạo danh mục thành công',
                    'data' => $category
                ]
            ];
        } catch (Exception $e) {
            Log::error('Create category failed: ' . $e->getMessage());
            return [
                'isCreated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Tạo danh mục thất bại',
                ]
            ];
        }
    }

    /**
     * Thực hiện cập nhật danh mục
     */
    private function performUpdateCategory($category, $data)
    {
        try {
            DB::transaction(function () use ($category, $data) {
                $category->update([
                    'name' => $data['name'],
                    'parentId' => $data['parentId'] ?? null,
                ]);
            });

            $category->refresh()->load(['parent', 'children']);

            return [
                'isUpdated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Cập nhật danh mục thành công',
                    'data' => $category
                ]
            ];
        } catch (Exception $e) {
            Log::error('Update category failed: ' . $e->getMessage());
            return [
                'isUpdated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Cập nhật danh mục thất bại',
                ]
            ];
        }
    }

    /**
     * Thực hiện xóa danh mục
     */
    private function performDeleteCategory($category)
    {
        try {
            DB::transaction(function () use ($category) {
                // Xóa các liên kết với sản phẩm (nếu có)
                $category->products()->detach();
                
                // Xóa danh mục
                $category->delete();
            });

            return [
                'isDeleted' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Xóa danh mục thành công',
                ]
            ];
        } catch (Exception $e) {
            Log::error('Delete category failed: ' . $e->getMessage());
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Xóa danh mục thất bại',
                ]
            ];
        }
    }
}
