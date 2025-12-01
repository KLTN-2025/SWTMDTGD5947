<?php

namespace App\Http\Controllers;

use App\services\SizeService;
use Illuminate\Http\Request;

class SizeController extends Controller
{
    protected $sizeService;

    public function __construct(SizeService $sizeService)
    {
        $this->sizeService = $sizeService;
    }

    /**
     * Lấy danh sách tất cả sizes
     */
    public function index(Request $request)
    {
        $result = $this->sizeService->getAllSizes();
        return response()->json($result);
    }
}
