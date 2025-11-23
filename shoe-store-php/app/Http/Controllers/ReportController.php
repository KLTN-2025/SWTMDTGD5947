<?php

namespace App\Http\Controllers;

use App\services\ReportService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Get overview statistics
     */
    public function getOverview(Request $request)
    {
        return response()->json($this->reportService->getOverviewStats($request));
    }

    /**
     * Get revenue by period
     */
    public function getRevenueByPeriod(Request $request)
    {
        return response()->json($this->reportService->getRevenueByPeriod($request));
    }

    /**
     * Get top selling products
     */
    public function getTopSellingProducts(Request $request)
    {
        return response()->json($this->reportService->getTopSellingProducts($request));
    }

    /**
     * Get inventory status
     */
    public function getInventoryStatus(Request $request)
    {
        return response()->json($this->reportService->getInventoryStatus($request));
    }

    /**
     * Get order statistics
     */
    public function getOrderStats(Request $request)
    {
        return response()->json($this->reportService->getOrderStats($request));
    }

    /**
     * Get payment statistics
     */
    public function getPaymentStats(Request $request)
    {
        return response()->json($this->reportService->getPaymentStats($request));
    }

    /**
     * Get top and bottom rated products
     */
    public function getRatedProducts(Request $request)
    {
        return response()->json($this->reportService->getRatedProducts($request));
    }

    /**
     * Get top customers by spending
     */
    public function getTopCustomers(Request $request)
    {
        return response()->json($this->reportService->getTopCustomers($request));
    }

    /**
     * Get revenue by category
     */
    public function getRevenueByCategory(Request $request)
    {
        return response()->json($this->reportService->getRevenueByCategory($request));
    }
}

