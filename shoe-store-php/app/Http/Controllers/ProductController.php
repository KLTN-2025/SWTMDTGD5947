<?php

namespace App\Http\Controllers;

use App\services\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function index(Request $request)
    {
        $result = $this->productService->getAllProducts($request);
        return response()->json($result);
    }

    public function show($id)
    {
        $result = $this->productService->getProductById($id);
        return response()->json($result);
    }

    public function store(Request $request)
    {
        $result = $this->productService->createProduct($request);
        return response()->json($result);
    }

    public function update(Request $request, $id)
    {
        $result = $this->productService->updateProduct($id, $request);
        return response()->json($result);
    }

    public function destroy($id)
    {
        $result = $this->productService->deleteProduct($id);
        return response()->json($result);
    }

    public function search(Request $request)
    {
        $result = $this->productService->searchProducts($request);
        return response()->json($result);
    }

    public function deleteImage($imageId)
    {
        $result = $this->productService->deleteProductImage($imageId);
        return response()->json($result);
    }
}
