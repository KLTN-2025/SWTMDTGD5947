<?php

namespace App\Http\Controllers;

use App\services\CategoryService;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    /**
     * Lấy danh sách tất cả danh mục
     */
    public function index(Request $request)
    {
        $result = $this->categoryService->getAllCategories($request);
        return response()->json($result);
    }

    /**
     * Lấy chi tiết danh mục theo ID
     */
    public function show($id)
    {
        $result = $this->categoryService->getCategoryById($id);
        return response()->json($result);
    }

    /**
     * Tạo danh mục mới
     */
    public function store(Request $request)
    {
        $result = $this->categoryService->createCategory($request);
        return response()->json($result);
    }

    /**
     * Cập nhật danh mục
     */
    public function update(Request $request, $id)
    {
        $result = $this->categoryService->updateCategory($id, $request);
        return response()->json($result);
    }

    /**
     * Xóa danh mục
     */
    public function destroy($id)
    {
        $result = $this->categoryService->deleteCategory($id);
        return response()->json($result);
    }
}
