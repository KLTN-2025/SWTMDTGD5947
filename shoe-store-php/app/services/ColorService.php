<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Color;
use Illuminate\Support\Facades\Log;
use Exception;

class ColorService
{
    protected $colorModel;

    public function __construct()
    {
        $this->colorModel = new Color();
    }

    /**
     * Lấy danh sách tất cả màu sắc
     */
    public function getAllColors()
    {
        try {
            $colors = Color::orderBy('name', 'asc')->get();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách màu sắc thành công',
                'data' => $colors
            ];
        } catch (Exception $e) {
            Log::error('Get all colors failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách màu sắc thất bại',
            ];
        }
    }
}
