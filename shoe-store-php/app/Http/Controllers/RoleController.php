<?php

namespace App\Http\Controllers;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class RoleController extends Controller
{
    public function index()
    {
        try {
            $roles = Role::orderBy('id', 'asc')->get();

            return response()->json([
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy danh sách vai trò thành công',
                'data' => $roles
            ]);
        } catch (Exception $e) {
            Log::error('Get all roles failed: ' . $e->getMessage());
            return response()->json([
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy danh sách vai trò thất bại',
            ], HttpCode::SERVER_ERROR);
        }
    }
}
