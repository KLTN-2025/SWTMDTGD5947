<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Size;
use Illuminate\Support\Facades\Log;
use Exception;

class SizeService
{
    protected $sizeModel;

    public function __construct()
    {
        $this->sizeModel = new Size();
    }

    /**
     * Lấy danh sách tất cả sizes
     */
    public function getAllSizes()
    {
        try {
            $sizes = Size::orderBy('nameSize', 'asc')->get();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách sizes thành công',
                'data' => $sizes
            ];
        } catch (Exception $e) {
            Log::error('Get all sizes failed: ' . $e->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách sizes thất bại',
            ];
        }
    }
}

