<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Exception;

class ProductService
{
    protected $productModel;

    public function __construct()
    {
        $this->productModel = new Product();
    }

    public function getAllProducts($request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $products = Product::with(['images', 'categories', 'variants.size'])
                ->orderBy('createdAt', 'desc')
                ->paginate($perPage);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách sản phẩm thành công',
                'data' => [
                    'products' => $products->items(),
                    'pagination' => [
                        'total' => $products->total(),
                        'per_page' => $products->perPage(),
                        'current_page' => $products->currentPage(),
                        'last_page' => $products->lastPage(),
                        'from' => $products->firstItem(),
                        'to' => $products->lastItem(),
                    ]
                ]
            ];
        } catch (Exception $e) {
            Log::error('Get all products failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách sản phẩm thất bại',
            ];
        }
    }

    public function getProductById($id)
    {
        $validationResult = $this->validateProductId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $productResult = $this->findProduct($id);
        if (!$productResult['isFound']) {
            return $productResult['response'];
        }

        return [
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'msgCode' => MsgCode::SUCCESS,
            'message' => 'Lấy thông tin sản phẩm thành công',
            'data' => $productResult['product']
        ];
    }

    public function createProduct($request)
    {
        $validationResult = $this->validateProductData($request);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $skuCheckResult = $this->checkSkuExists($validationResult['data']['skuId']);
        if (!$skuCheckResult['isAvailable']) {
            return $skuCheckResult['response'];
        }

        $createResult = $this->performCreateProduct($validationResult['data'], $request);
        if (!$createResult['isCreated']) {
            return $createResult['response'];
        }

        return $createResult['response'];
    }

    public function updateProduct($id, $request)
    {
        $validationResult = $this->validateProductId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $productResult = $this->findProduct($id);
        if (!$productResult['isFound']) {
            return $productResult['response'];
        }

        $validationDataResult = $this->validateProductData($request, $id);
        if (!$validationDataResult['isValid']) {
            return $validationDataResult['response'];
        }

        $updateResult = $this->performUpdateProduct($productResult['product'], $validationDataResult['data'], $request);
        if (!$updateResult['isUpdated']) {
            return $updateResult['response'];
        }

        return $updateResult['response'];
    }

    public function deleteProduct($id)
    {
        $validationResult = $this->validateProductId($id);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $productResult = $this->findProduct($id);
        if (!$productResult['isFound']) {
            return $productResult['response'];
        }

        $deleteResult = $this->performDeleteProduct($productResult['product']);
        if (!$deleteResult['isDeleted']) {
            return $deleteResult['response'];
        }

        return $deleteResult['response'];
    }

    public function searchProducts($request)
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
            'category_id' => 'nullable|integer|exists:categories,id',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:SOLD_OUT,IN_STOCK,PRE_SALE',
            'sort_by' => 'nullable|in:name,basePrice,createdAt',
            'sort_order' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1|max:100',
        ], [
            'keyword.string' => 'Từ khóa tìm kiếm phải là chuỗi ký tự.',
            'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá :max ký tự.',
            'category_id.integer' => 'ID danh mục phải là số nguyên.',
            'category_id.exists' => 'Danh mục không tồn tại.',
            'min_price.numeric' => 'Giá tối thiểu phải là số.',
            'min_price.min' => 'Giá tối thiểu phải lớn hơn hoặc bằng 0.',
            'max_price.numeric' => 'Giá tối đa phải là số.',
            'max_price.min' => 'Giá tối đa phải lớn hơn hoặc bằng 0.',
            'status.in' => 'Trạng thái không hợp lệ.',
            'sort_by.in' => 'Trường sắp xếp không hợp lệ.',
            'sort_order.in' => 'Thứ tự sắp xếp không hợp lệ.',
            'per_page.integer' => 'Số lượng sản phẩm trên trang phải là số nguyên.',
            'per_page.min' => 'Số lượng sản phẩm trên trang phải lớn hơn 0.',
            'per_page.max' => 'Số lượng sản phẩm trên trang không được vượt quá :max.',
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
            // Debug log
            Log::info('Search params received:', $data);
            
            $query = Product::query()->with(['images', 'categories', 'variants.size']);

            // Tìm kiếm theo từ khóa
            if (!empty($data['keyword'])) {
                $keyword = $data['keyword'];
                Log::info('Searching with keyword:', ['keyword' => $keyword]);
                $query->where(function ($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%");
                });
            } else {
                Log::info('No keyword provided, returning all products');
            }

            // Lọc theo danh mục
            if (!empty($data['category_id'])) {
                $query->whereHas('categories', function ($q) use ($data) {
                    $q->where('categories.id', $data['category_id']);
                });
            }

            // Lọc theo khoảng giá
            if (isset($data['min_price'])) {
                $query->where('basePrice', '>=', $data['min_price']);
            }

            if (isset($data['max_price'])) {
                $query->where('basePrice', '<=', $data['max_price']);
            }

            // Lọc theo trạng thái
            if (!empty($data['status'])) {
                $query->where('status', $data['status']);
            }

            // Sắp xếp
            $sortBy = $data['sort_by'] ?? 'createdAt';
            $sortOrder = $data['sort_order'] ?? 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // Phân trang
            $perPage = $data['per_page'] ?? 15;
            $products = $query->paginate($perPage);

            return [
                'isSuccess' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Tìm kiếm sản phẩm thành công',
                    'data' => [
                        'products' => $products->items(),
                        'pagination' => [
                            'total' => $products->total(),
                            'per_page' => $products->perPage(),
                            'current_page' => $products->currentPage(),
                            'last_page' => $products->lastPage(),
                            'from' => $products->firstItem(),
                            'to' => $products->lastItem(),
                        ]
                    ]
                ]
            ];
        } catch (Exception $e) {
            Log::error('Product search failed: ' . $e->getMessage());
            return [
                'isSuccess' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Tìm kiếm sản phẩm thất bại',
                ]
            ];
        }
    }

    private function validateProductId($id)
    {
        $validator = Validator::make(['id' => $id], [
            'id' => 'required|integer|min:1',
        ], [
            'id.required' => 'ID sản phẩm là bắt buộc.',
            'id.integer' => 'ID sản phẩm phải là số nguyên.',
            'id.min' => 'ID sản phẩm không hợp lệ.',
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

    private function findProduct($id)
    {
        try {
            $product = Product::with(['images', 'categories', 'variants.size'])->find($id);

            if (!$product) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Sản phẩm không tồn tại',
                    ]
                ];
            }

            return [
                'isFound' => true,
                'product' => $product
            ];
        } catch (Exception $e) {
            Log::error('Find product failed: ' . $e->getMessage());
            return [
                'isFound' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi tìm sản phẩm',
                ]
            ];
        }
    }

    private function validateProductData($request, $productId = null)
    {
        $rules = [
            'skuId' => 'required|string|max:50',
            'name' => 'required|string|max:50',
            'status' => 'required|in:SOLD_OUT,IN_STOCK,PRE_SALE',
            'description' => 'nullable|string',
            'basePrice' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer|exists:categories,id',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ];

        // Nếu là update, cho phép skuId trùng với chính nó
        if ($productId) {
            $rules['skuId'] = 'required|string|max:50|unique:products,skuId,' . $productId;
        } else {
            $rules['skuId'] = 'required|string|max:50|unique:products,skuId';
        }

        $validator = Validator::make($request->all(), $rules, [
            'skuId.required' => 'Mã SKU là bắt buộc.',
            'skuId.unique' => 'Mã SKU đã tồn tại.',
            'skuId.max' => 'Mã SKU không được vượt quá :max ký tự.',
            'name.required' => 'Tên sản phẩm là bắt buộc.',
            'name.max' => 'Tên sản phẩm không được vượt quá :max ký tự.',
            'status.required' => 'Trạng thái là bắt buộc.',
            'status.in' => 'Trạng thái không hợp lệ.',
            'basePrice.required' => 'Giá cơ bản là bắt buộc.',
            'basePrice.numeric' => 'Giá cơ bản phải là số.',
            'basePrice.min' => 'Giá cơ bản phải lớn hơn hoặc bằng 0.',
            'quantity.required' => 'Số lượng là bắt buộc.',
            'quantity.integer' => 'Số lượng phải là số nguyên.',
            'quantity.min' => 'Số lượng phải lớn hơn hoặc bằng 0.',
            'category_ids.array' => 'Danh mục phải là một mảng.',
            'category_ids.*.integer' => 'ID danh mục phải là số nguyên.',
            'category_ids.*.exists' => 'Danh mục không tồn tại.',
            'images.array' => 'Ảnh phải là một mảng.',
            'images.*.image' => 'File phải là ảnh.',
            'images.*.mimes' => 'Ảnh phải có định dạng: jpeg, png, jpg, gif, webp.',
            'images.*.max' => 'Kích thước ảnh không được vượt quá 2MB.',
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

    private function checkSkuExists($skuId)
    {
        $exists = Product::where('skuId', $skuId)->exists();

        if ($exists) {
            return [
                'isAvailable' => false,
                'response' => [
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'msgCode' => MsgCode::BAD_REQUEST,
                    'message' => 'Mã SKU đã tồn tại',
                ]
            ];
        }

        return ['isAvailable' => true];
    }

    private function performCreateProduct($data, $request)
    {
        try {
            $product = DB::transaction(function () use ($data, $request) {
                // Tạo sản phẩm
                $product = Product::create([
                    'skuId' => $data['skuId'],
                    'name' => $data['name'],
                    'status' => $data['status'],
                    'description' => $data['description'] ?? null,
                    'basePrice' => $data['basePrice'],
                    'quantity' => $data['quantity'],
                ]);

                // Xử lý danh mục
                if (!empty($data['category_ids'])) {
                    $product->categories()->attach($data['category_ids']);
                }

                // Xử lý upload ảnh
                if ($request->hasFile('images')) {
                    $this->handleImageUpload($product, $request->file('images'));
                }

                return $product->load(['images', 'categories', 'variants.size']);
            });

            return [
                'isCreated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Tạo sản phẩm thành công',
                    'data' => $product
                ]
            ];
        } catch (Exception $e) {
            Log::error('Create product failed: ' . $e->getMessage());
            return [
                'isCreated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Tạo sản phẩm thất bại',
                ]
            ];
        }
    }

    private function performUpdateProduct($product, $data, $request)
    {
        try {
            DB::transaction(function () use ($product, $data, $request) {
                // Cập nhật thông tin sản phẩm
                $product->update([
                    'skuId' => $data['skuId'],
                    'name' => $data['name'],
                    'status' => $data['status'],
                    'description' => $data['description'] ?? null,
                    'basePrice' => $data['basePrice'],
                    'quantity' => $data['quantity'],
                ]);

                // Cập nhật danh mục
                if (isset($data['category_ids'])) {
                    $product->categories()->sync($data['category_ids']);
                }

                // Xử lý upload ảnh mới
                if ($request->hasFile('images')) {
                    $this->handleImageUpload($product, $request->file('images'));
                }
            });

            $product->refresh()->load(['images', 'categories', 'variants.size']);

            return [
                'isUpdated' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Cập nhật sản phẩm thành công',
                    'data' => $product
                ]
            ];
        } catch (Exception $e) {
            Log::error('Update product failed: ' . $e->getMessage());
            return [
                'isUpdated' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Cập nhật sản phẩm thất bại',
                ]
            ];
        }
    }

    private function performDeleteProduct($product)
    {
        try {
            DB::transaction(function () use ($product) {
                // Xóa tất cả ảnh của sản phẩm
                $this->deleteProductImages($product);

                // Xóa sản phẩm (cascade sẽ xóa các bản ghi liên quan)
                $product->delete();
            });

            return [
                'isDeleted' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Xóa sản phẩm thành công',
                ]
            ];
        } catch (Exception $e) {
            Log::error('Delete product failed: ' . $e->getMessage());
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Xóa sản phẩm thất bại',
                ]
            ];
        }
    }

    private function handleImageUpload($product, $images)
    {
        foreach ($images as $image) {
            // Tạo tên file unique
            $fileName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            
            // Lưu file vào thư mục public/products
            $path = $image->move(public_path('products'), $fileName);
            
            // Lưu thông tin ảnh vào database
            ProductImage::create([
                'productId' => $product->id,
                'url' => 'products/' . $fileName,
            ]);
        }
    }

    private function deleteProductImages($product)
    {
        foreach ($product->images as $image) {
            // Xóa file ảnh từ thư mục public
            $imagePath = public_path($image->url);
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
            
            // Xóa record trong database
            $image->delete();
        }
    }

    public function deleteProductImage($imageId)
    {
        $validationResult = $this->validateImageId($imageId);
        if (!$validationResult['isValid']) {
            return $validationResult['response'];
        }

        $imageResult = $this->findProductImage($imageId);
        if (!$imageResult['isFound']) {
            return $imageResult['response'];
        }

        $deleteResult = $this->performDeleteImage($imageResult['image']);
        if (!$deleteResult['isDeleted']) {
            return $deleteResult['response'];
        }

        return $deleteResult['response'];
    }

    private function validateImageId($id)
    {
        $validator = Validator::make(['id' => $id], [
            'id' => 'required|integer|min:1',
        ], [
            'id.required' => 'ID ảnh là bắt buộc.',
            'id.integer' => 'ID ảnh phải là số nguyên.',
            'id.min' => 'ID ảnh không hợp lệ.',
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

    private function findProductImage($id)
    {
        try {
            $image = ProductImage::find($id);

            if (!$image) {
                return [
                    'isFound' => false,
                    'response' => [
                        'code' => HttpCode::NOT_FOUND,
                        'status' => false,
                        'msgCode' => MsgCode::NOT_FOUND,
                        'message' => 'Ảnh không tồn tại',
                    ]
                ];
            }

            return [
                'isFound' => true,
                'image' => $image
            ];
        } catch (Exception $e) {
            Log::error('Find product image failed: ' . $e->getMessage());
            return [
                'isFound' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Lỗi khi tìm ảnh',
                ]
            ];
        }
    }

    private function performDeleteImage($image)
    {
        try {
            // Xóa file ảnh từ thư mục public
            $imagePath = public_path($image->url);
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }

            // Xóa record trong database
            $image->delete();

            return [
                'isDeleted' => true,
                'response' => [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Xóa ảnh thành công',
                ]
            ];
        } catch (Exception $e) {
            Log::error('Delete product image failed: ' . $e->getMessage());
            return [
                'isDeleted' => false,
                'response' => [
                    'code' => HttpCode::SERVER_ERROR,
                    'status' => false,
                    'msgCode' => MsgCode::SERVER_ERROR,
                    'message' => 'Xóa ảnh thất bại',
                ]
            ];
        }
    }
}
