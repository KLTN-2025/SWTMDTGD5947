<?php

namespace App\services;

use App\Helper\HttpCode;
use App\Helper\MsgCode;
use App\Helper\Constants;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Role;
use App\Models\Payment;
use App\Models\Review;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

class ReportService
{
    /**
     * Get overview statistics with comparison to previous period
     */
    public function getOverviewStats($request): array
    {
        try {
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();
            
            // Previous period for comparison
            $prevStartDate = $startDate->copy()->subDays($period);
            $prevEndDate = $startDate->copy()->subSecond();

            // Get USER role ID
            $userRole = Role::where('name', Constants::USER)->first();
            $userRoleId = $userRole ? $userRole->id : null;

            // Total revenue (from completed orders)
            $totalRevenue = Order::where('status', Order::STATUS_COMPLETED)
                ->whereBetween('createdAt', [$startDate, $endDate])
                ->sum('amount');

            // Total orders
            $totalOrders = Order::whereBetween('createdAt', [$startDate, $endDate])->count();
            $completedOrders = Order::where('status', Order::STATUS_COMPLETED)
                ->whereBetween('createdAt', [$startDate, $endDate])
                ->count();
            $pendingOrders = Order::where('status', Order::STATUS_PENDING)
                ->whereBetween('createdAt', [$startDate, $endDate])
                ->count();

            // Total customers (users with USER role)
            $totalCustomers = $userRoleId 
                ? User::where('roleId', $userRoleId)->count()
                : 0;
            $newCustomers = $userRoleId
                ? User::where('roleId', $userRoleId)
                    ->whereBetween('createdAt', [$startDate, $endDate])
                    ->count()
                : 0;

            // Total products
            $totalProducts = Product::count();
            $activeProducts = Product::where('status', Product::STATUS_IN_STOCK)->count();

            // Average order value
            $avgOrderValue = $completedOrders > 0 ? ($totalRevenue / $completedOrders) : 0;

            // Conversion rate (customers who made orders / total customers)
            $customersWithOrders = Order::whereBetween('createdAt', [$startDate, $endDate])
                ->distinct('userId')
                ->count('userId');
            $conversionRate = $totalCustomers > 0 ? (($customersWithOrders / $totalCustomers) * 100) : 0;

            // Previous period data for comparison
            $prevTotalRevenue = Order::where('status', Order::STATUS_COMPLETED)
                ->whereBetween('createdAt', [$prevStartDate, $prevEndDate])
                ->sum('amount');
            $prevTotalOrders = Order::whereBetween('createdAt', [$prevStartDate, $prevEndDate])->count();
            $prevCompletedOrders = Order::where('status', Order::STATUS_COMPLETED)
                ->whereBetween('createdAt', [$prevStartDate, $prevEndDate])
                ->count();
            $prevNewCustomers = $userRoleId
                ? User::where('roleId', $userRoleId)
                    ->whereBetween('createdAt', [$prevStartDate, $prevEndDate])
                    ->count()
                : 0;

            // Calculate growth percentages
            $revenueGrowth = $prevTotalRevenue > 0 
                ? (($totalRevenue - $prevTotalRevenue) / $prevTotalRevenue) * 100 
                : ($totalRevenue > 0 ? 100 : 0);
            $ordersGrowth = $prevTotalOrders > 0 
                ? (($totalOrders - $prevTotalOrders) / $prevTotalOrders) * 100 
                : ($totalOrders > 0 ? 100 : 0);
            $customersGrowth = $prevNewCustomers > 0 
                ? (($newCustomers - $prevNewCustomers) / $prevNewCustomers) * 100 
                : ($newCustomers > 0 ? 100 : 0);

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy thống kê tổng quan thành công',
                'data' => [
                    'revenue' => [
                        'total' => (float) $totalRevenue,
                        'averageDaily' => $period > 0 ? (float) ($totalRevenue / $period) : 0,
                        'averageOrderValue' => (float) $avgOrderValue,
                        'previousPeriod' => (float) $prevTotalRevenue,
                        'growth' => round($revenueGrowth, 2),
                    ],
                    'orders' => [
                        'total' => $totalOrders,
                        'completed' => $completedOrders,
                        'pending' => $pendingOrders,
                        'cancelled' => Order::where('status', Order::STATUS_CANCELLED)
                            ->whereBetween('createdAt', [$startDate, $endDate])
                            ->count(),
                        'previousPeriod' => $prevTotalOrders,
                        'growth' => round($ordersGrowth, 2),
                    ],
                    'customers' => [
                        'total' => $totalCustomers,
                        'new' => $newCustomers,
                        'withOrders' => $customersWithOrders,
                        'conversionRate' => round($conversionRate, 2),
                        'previousPeriod' => $prevNewCustomers,
                        'growth' => round($customersGrowth, 2),
                    ],
                    'products' => [
                        'total' => $totalProducts,
                        'active' => $activeProducts,
                        'soldOut' => Product::where('status', Product::STATUS_SOLD_OUT)->count(),
                    ],
                    'period' => $period,
                    'startDate' => $startDate->toDateTimeString(),
                    'endDate' => $endDate->toDateTimeString(),
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get overview stats failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy thống kê tổng quan thất bại',
            ];
        }
    }

    /**
     * Get revenue by period (daily, weekly, monthly)
     */
    public function getRevenueByPeriod($request): array
    {
        try {
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $revenueData = Order::where('status', Order::STATUS_COMPLETED)
                ->whereBetween('createdAt', [$startDate, $endDate])
                ->select(
                    DB::raw('DATE(createdAt) as date'),
                    DB::raw('SUM(amount) as revenue'),
                    DB::raw('COUNT(*) as orderCount')
                )
                ->groupBy(DB::raw('DATE(createdAt)'))
                ->orderBy('date', 'asc')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'revenue' => (float) $item->revenue,
                        'orderCount' => (int) $item->orderCount,
                    ];
                });

            // Fill missing dates with zero revenue
            $allDates = [];
            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                $dateStr = $currentDate->format('Y-m-d');
                $existing = $revenueData->firstWhere('date', $dateStr);
                $allDates[] = $existing ?: [
                    'date' => $dateStr,
                    'revenue' => 0.0,
                    'orderCount' => 0,
                ];
                $currentDate->addDay();
            }

            $maxRevenue = $revenueData->max('revenue') ?: 0;
            $minRevenue = $revenueData->min('revenue') ?: 0;
            $totalRevenue = $revenueData->sum('revenue');

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy doanh thu theo kỳ thành công',
                'data' => [
                    'revenueByDay' => $allDates,
                    'summary' => [
                        'total' => (float) $totalRevenue,
                        'average' => count($allDates) > 0 ? (float) ($totalRevenue / count($allDates)) : 0,
                        'max' => (float) $maxRevenue,
                        'min' => (float) $minRevenue,
                    ],
                    'period' => $period,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get revenue by period failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy doanh thu theo kỳ thất bại',
            ];
        }
    }

    /**
     * Get top selling products
     */
    public function getTopSellingProducts($request): array
    {
        try {
            $limit = (int) $request->input('limit', 10);
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $topProducts = OrderItem::whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->where('status', Order::STATUS_COMPLETED)
                    ->whereBetween('createdAt', [$startDate, $endDate]);
            })
                ->select(
                    'productVariantId',
                    DB::raw('SUM(quantity) as totalSold'),
                    DB::raw('SUM(amount) as totalRevenue')
                )
                ->groupBy('productVariantId')
                ->orderBy('totalSold', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($item) {
                    $variant = ProductVariant::with([
                        'product:id,name,basePrice,skuId',
                        'product.images',
                        'size:id,nameSize',
                    ])->find($item->productVariantId);

                    if (!$variant || !$variant->product) {
                        return null;
                    }

                    return [
                        'productVariantId' => $item->productVariantId,
                        'productId' => $variant->product->id,
                        'productName' => $variant->product->name,
                        'skuId' => $variant->product->skuId,
                        'basePrice' => (float) $variant->product->basePrice,
                        'size' => $variant->size ? [
                            'id' => $variant->size->id,
                            'name' => $variant->size->nameSize,
                        ] : null,
                        'mainImage' => $variant->product->images->first()?->fullUrl ?? null,
                        'totalSold' => (int) $item->totalSold,
                        'totalRevenue' => (float) $item->totalRevenue,
                    ];
                })
                ->filter()
                ->values();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy sản phẩm bán chạy thành công',
                'data' => [
                    'products' => $topProducts,
                    'period' => $period,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get top selling products failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy sản phẩm bán chạy thất bại',
            ];
        }
    }

    /**
     * Get top and bottom rated products
     */
    public function getRatedProducts($request): array
    {
        try {
            $limit = (int) $request->input('limit', 10);
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            // Top rated products
            $topRated = Review::whereBetween('createdAt', [$startDate, $endDate])
                ->select(
                    'productId',
                    DB::raw('AVG(rating) as averageRating'),
                    DB::raw('COUNT(*) as reviewCount')
                )
                ->groupBy('productId')
                ->havingRaw('COUNT(*) >= 1')
                ->orderBy('averageRating', 'desc')
                ->orderBy('reviewCount', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($item) {
                    $product = Product::with(['images'])->find($item->productId);
                    if (!$product) {
                        return null;
                    }

                    return [
                        'productId' => $product->id,
                        'productName' => $product->name,
                        'skuId' => $product->skuId,
                        'basePrice' => (float) $product->basePrice,
                        'mainImage' => $product->images->first()?->fullUrl ?? null,
                        'averageRating' => round((float) $item->averageRating, 2),
                        'reviewCount' => (int) $item->reviewCount,
                    ];
                })
                ->filter()
                ->values();

            // Bottom rated products
            $bottomRated = Review::whereBetween('createdAt', [$startDate, $endDate])
                ->select(
                    'productId',
                    DB::raw('AVG(rating) as averageRating'),
                    DB::raw('COUNT(*) as reviewCount')
                )
                ->groupBy('productId')
                ->havingRaw('COUNT(*) >= 1')
                ->orderBy('averageRating', 'asc')
                ->orderBy('reviewCount', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($item) {
                    $product = Product::with(['images'])->find($item->productId);
                    if (!$product) {
                        return null;
                    }

                    return [
                        'productId' => $product->id,
                        'productName' => $product->name,
                        'skuId' => $product->skuId,
                        'basePrice' => (float) $product->basePrice,
                        'mainImage' => $product->images->first()?->fullUrl ?? null,
                        'averageRating' => round((float) $item->averageRating, 2),
                        'reviewCount' => (int) $item->reviewCount,
                    ];
                })
                ->filter()
                ->values();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy sản phẩm đánh giá thành công',
                'data' => [
                    'topRated' => $topRated,
                    'bottomRated' => $bottomRated,
                    'period' => $period,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get rated products failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy sản phẩm đánh giá thất bại',
            ];
        }
    }

    /**
     * Get inventory status
     */
    public function getInventoryStatus($request): array
    {
        try {
            $lowStockThreshold = (int) $request->input('lowStockThreshold', 10);

            $products = Product::with(['images', 'variants.size'])
                ->get()
                ->map(function ($product) use ($lowStockThreshold) {
                    $totalQuantity = $product->variants->sum('quantity');
                    $status = 'in_stock';
                    if ($totalQuantity === 0) {
                        $status = 'out_of_stock';
                    } elseif ($totalQuantity < $lowStockThreshold) {
                        $status = 'low_stock';
                    }

                    return [
                        'productId' => $product->id,
                        'name' => $product->name,
                        'skuId' => $product->skuId,
                        'basePrice' => (float) $product->basePrice,
                        'mainImage' => $product->images->first()?->fullUrl ?? null,
                        'totalQuantity' => $totalQuantity,
                        'status' => $status,
                        'statusDisplay' => $this->getInventoryStatusDisplay($status),
                    ];
                });

            $summary = [
                'total' => $products->count(),
                'inStock' => $products->where('status', 'in_stock')->count(),
                'lowStock' => $products->where('status', 'low_stock')->count(),
                'outOfStock' => $products->where('status', 'out_of_stock')->count(),
            ];

            $lowStockProducts = $products->where('status', '!=', 'in_stock')
                ->sortBy('totalQuantity')
                ->values();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy tình trạng tồn kho thành công',
                'data' => [
                    'summary' => $summary,
                    'lowStockProducts' => $lowStockProducts,
                    'allProducts' => $products->values(),
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get inventory status failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy tình trạng tồn kho thất bại',
            ];
        }
    }

    /**
     * Get order statistics by status
     */
    public function getOrderStats($request): array
    {
        try {
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $stats = Order::whereBetween('createdAt', [$startDate, $endDate])
                ->select(
                    'status',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as totalAmount')
                )
                ->groupBy('status')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [
                        $item->status => [
                            'count' => (int) $item->count,
                            'totalAmount' => (float) $item->totalAmount,
                        ],
                    ];
                });

            $allStatuses = [
                Order::STATUS_PENDING,
                Order::STATUS_CONFIRMED,
                Order::STATUS_SHIPPED,
                Order::STATUS_COMPLETED,
                Order::STATUS_CANCELLED,
            ];

            $result = [];
            foreach ($allStatuses as $status) {
                $result[$status] = $stats[$status] ?? [
                    'count' => 0,
                    'totalAmount' => 0.0,
                ];
            }

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy thống kê đơn hàng thành công',
                'data' => [
                    'stats' => $result,
                    'period' => $period,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get order stats failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy thống kê đơn hàng thất bại',
            ];
        }
    }

    /**
     * Get payment statistics
     */
    public function getPaymentStats($request): array
    {
        try {
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $stats = Payment::whereBetween('createdAt', [$startDate, $endDate])
                ->select(
                    'status',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as totalAmount')
                )
                ->groupBy('status')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [
                        $item->status => [
                            'count' => (int) $item->count,
                            'totalAmount' => (float) $item->totalAmount,
                        ],
                    ];
                });

            $allStatuses = [
                Payment::STATUS_PENDING,
                Payment::STATUS_UNPAID,
                Payment::STATUS_PAID,
                Payment::STATUS_CANCELLED,
                Payment::STATUS_REFUNDED,
                Payment::STATUS_FAILED,
            ];

            $result = [];
            foreach ($allStatuses as $status) {
                $result[$status] = $stats[$status] ?? [
                    'count' => 0,
                    'totalAmount' => 0.0,
                ];
            }

            // Payment method stats
            $methodStats = Order::whereBetween('createdAt', [$startDate, $endDate])
                ->select(
                    'paymentMethod',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(amount) as totalAmount')
                )
                ->groupBy('paymentMethod')
                ->get()
                ->map(function ($item) {
                    return [
                        'method' => $item->paymentMethod,
                        'count' => (int) $item->count,
                        'totalAmount' => (float) $item->totalAmount,
                    ];
                })
                ->values();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy thống kê thanh toán thành công',
                'data' => [
                    'statusStats' => $result,
                    'methodStats' => $methodStats,
                    'period' => $period,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get payment stats failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy thống kê thanh toán thất bại',
            ];
        }
    }

    /**
     * Get top customers by spending
     */
    public function getTopCustomers($request): array
    {
        try {
            $limit = (int) $request->input('limit', 10);
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $userRole = Role::where('name', Constants::USER)->first();
            $userRoleId = $userRole ? $userRole->id : null;

            if (!$userRoleId) {
                return [
                    'code' => HttpCode::SUCCESS,
                    'status' => true,
                    'msgCode' => MsgCode::SUCCESS,
                    'message' => 'Lấy top khách hàng thành công',
                    'data' => [
                        'customers' => [],
                        'period' => $period,
                    ],
                ];
            }

            $topCustomers = Order::where('status', Order::STATUS_COMPLETED)
                ->whereBetween('createdAt', [$startDate, $endDate])
                ->whereHas('user', function ($query) use ($userRoleId) {
                    $query->where('roleId', $userRoleId);
                })
                ->select(
                    'userId',
                    DB::raw('SUM(amount) as totalSpent'),
                    DB::raw('COUNT(*) as orderCount')
                )
                ->groupBy('userId')
                ->orderBy('totalSpent', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($item) {
                    $user = User::find($item->userId);
                    if (!$user) {
                        return null;
                    }

                    return [
                        'userId' => $user->id,
                        'name' => $user->name ?? $user->userName ?? 'N/A',
                        'email' => $user->email,
                        'avatar' => $user->fullImageUrl ?? null,
                        'totalSpent' => (float) $item->totalSpent,
                        'orderCount' => (int) $item->orderCount,
                        'averageOrderValue' => (float) $item->totalSpent / max(1, (int) $item->orderCount),
                    ];
                })
                ->filter()
                ->values();

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy top khách hàng thành công',
                'data' => [
                    'customers' => $topCustomers,
                    'period' => $period,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get top customers failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy top khách hàng thất bại',
            ];
        }
    }

    /**
     * Get revenue by category
     */
    public function getRevenueByCategory($request): array
    {
        try {
            $period = (int) $request->input('period', 30); // days
            $startDate = Carbon::now()->subDays($period)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $revenueByCategory = OrderItem::whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->where('status', Order::STATUS_COMPLETED)
                    ->whereBetween('createdAt', [$startDate, $endDate]);
            })
                ->join('product_variants', 'order_items.productVariantId', '=', 'product_variants.id')
                ->join('products', 'product_variants.productId', '=', 'products.id')
                ->join('category_product', 'products.id', '=', 'category_product.productId')
                ->join('categories', 'category_product.categoryId', '=', 'categories.id')
                ->select(
                    'categories.id as categoryId',
                    'categories.name as categoryName',
                    DB::raw('SUM(order_items.amount) as totalRevenue'),
                    DB::raw('SUM(order_items.quantity) as totalQuantity'),
                    DB::raw('COUNT(DISTINCT order_items.orderId) as orderCount')
                )
                ->groupBy('categories.id', 'categories.name')
                ->orderBy('totalRevenue', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'categoryId' => (int) $item->categoryId,
                        'categoryName' => $item->categoryName,
                        'totalRevenue' => (float) $item->totalRevenue,
                        'totalQuantity' => (int) $item->totalQuantity,
                        'orderCount' => (int) $item->orderCount,
                    ];
                });

            $totalRevenue = $revenueByCategory->sum('totalRevenue');

            return [
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'msgCode' => MsgCode::SUCCESS,
                'message' => 'Lấy doanh thu theo danh mục thành công',
                'data' => [
                    'revenueByCategory' => $revenueByCategory->values(),
                    'totalRevenue' => (float) $totalRevenue,
                    'period' => $period,
                ],
            ];
        } catch (Exception $exception) {
            Log::error('Get revenue by category failed: ' . $exception->getMessage());
            return [
                'code' => HttpCode::SERVER_ERROR,
                'status' => false,
                'msgCode' => MsgCode::SERVER_ERROR,
                'message' => 'Lấy doanh thu theo danh mục thất bại',
            ];
        }
    }

    /**
     * Get inventory status display
     */
    private function getInventoryStatusDisplay($status): string
    {
        return match ($status) {
            'in_stock' => 'Đủ hàng',
            'low_stock' => 'Sắp hết',
            'out_of_stock' => 'Hết hàng',
            default => 'Không xác định',
        };
    }
}

