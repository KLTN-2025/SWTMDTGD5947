<?php

namespace App\Http\Controllers;

use App\services\CustomerService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    protected $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    /**
     * GET /api/admin/customers - Lấy danh sách khách hàng
     */
    public function index(Request $request)
    {
        $result = $this->customerService->getAllCustomers($request);
        return response()->json($result, $result['code']);
    }

    /**
     * GET /api/admin/customers/{id} - Lấy chi tiết khách hàng
     */
    public function show($id)
    {
        $result = $this->customerService->getCustomerById($id);
        return response()->json($result, $result['code']);
    }

    /**
     * POST /api/admin/customers - Tạo khách hàng mới
     */
    public function store(Request $request)
    {
        $result = $this->customerService->createCustomer($request);
        return response()->json($result, $result['code']);
    }

    /**
     * PUT /api/admin/customers/{id} - Cập nhật khách hàng
     */
    public function update(Request $request, $id)
    {
        $result = $this->customerService->updateCustomer($id, $request);
        return response()->json($result, $result['code']);
    }

    /**
     * POST /api/admin/customers/{id} - Cập nhật khách hàng (form-data)
     */
    public function updateFormData(Request $request, $id)
    {
        $result = $this->customerService->updateCustomer($id, $request);
        return response()->json($result, $result['code']);
    }

    /**
     * DELETE /api/admin/customers/{id} - Xóa khách hàng
     */
    public function destroy($id)
    {
        $result = $this->customerService->deleteCustomer($id);
        return response()->json($result, $result['code']);
    }
}
