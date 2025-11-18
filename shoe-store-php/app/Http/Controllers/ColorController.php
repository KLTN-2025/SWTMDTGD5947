<?php

namespace App\Http\Controllers;

use App\services\ColorService;
use Illuminate\Http\Request;

class ColorController extends Controller
{
    protected $colorService;

    public function __construct(ColorService $colorService)
    {
        $this->colorService = $colorService;
    }

    /**
     * Lấy danh sách tất cả màu sắc
     */
    public function index(Request $request)
    {
        $result = $this->colorService->getAllColors();
        return response()->json($result);
    }
}
