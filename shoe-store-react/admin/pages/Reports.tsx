import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  BarChart3,
  Award,
  Star,
  StarOff,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  CreditCard,
  FileText
} from "lucide-react";
import { 
  useOverviewStats, 
  useRevenueByPeriod, 
  useTopSellingProducts, 
  useRatedProducts,
  useOrderStats,
  usePaymentStats,
  useTopCustomers,
  useRevenueByCategory
} from "../lib/use-reports";
import { useQueryClient } from "@tanstack/react-query";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

type ReportTab = "overview" | "revenue" | "products" | "orders" | "payments" | "reviews" | "customers" | "categories";

export default function Reports() {
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch data from API
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useOverviewStats(period);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueByPeriod(period);
  const { data: topProductsData, isLoading: topProductsLoading } = useTopSellingProducts(10, period);
  const { data: ratedProductsData, isLoading: ratedProductsLoading } = useRatedProducts(10, period);
  const { data: orderStatsData, isLoading: orderStatsLoading } = useOrderStats(period);
  const { data: paymentStatsData, isLoading: paymentStatsLoading } = usePaymentStats(period);
  const { data: topCustomersData, isLoading: topCustomersLoading } = useTopCustomers(10, period);
  const { data: revenueByCategoryData, isLoading: revenueByCategoryLoading } = useRevenueByCategory(period);
  
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  // Filter top products by search
  const filteredTopProducts = useMemo(() => {
    if (!topProductsData?.products) return [];
    if (!searchQuery) return topProductsData.products;
    const query = searchQuery.toLowerCase();
    return topProductsData.products.filter(p => 
      p.productName.toLowerCase().includes(query) ||
      p.skuId.toLowerCase().includes(query)
    );
  }, [topProductsData, searchQuery]);

  // Filter rated products by search
  const filteredTopRated = useMemo(() => {
    if (!ratedProductsData?.topRated) return [];
    if (!searchQuery) return ratedProductsData.topRated;
    const query = searchQuery.toLowerCase();
    return ratedProductsData.topRated.filter(p => 
      p.productName.toLowerCase().includes(query) ||
      p.skuId.toLowerCase().includes(query)
    );
  }, [ratedProductsData, searchQuery]);

  const filteredBottomRated = useMemo(() => {
    if (!ratedProductsData?.bottomRated) return [];
    if (!searchQuery) return ratedProductsData.bottomRated;
    const query = searchQuery.toLowerCase();
    return ratedProductsData.bottomRated.filter(p => 
      p.productName.toLowerCase().includes(query) ||
      p.skuId.toLowerCase().includes(query)
    );
  }, [ratedProductsData, searchQuery]);

  // Calculate chart metrics
  const revenueByDay = revenueData?.revenueByDay || [];
  const maxRevenue = revenueData?.summary.max || 1; // Avoid division by zero
  const totalRevenue = overview?.revenue.total || 0;
  const avgDaily = overview?.revenue.averageDaily || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo & Thống kê</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Phân tích doanh thu, sản phẩm và hiệu suất kinh doanh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(period)} onValueChange={(v) => setPeriod(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày qua</SelectItem>
              <SelectItem value="14">14 ngày qua</SelectItem>
              <SelectItem value="30">30 ngày qua</SelectItem>
              <SelectItem value="90">90 ngày qua</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Key Metrics - Always visible with Growth Indicators */}
      {!overviewLoading && overview && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng doanh thu</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{totalRevenue.toLocaleString("vi-VN")}₫</p>
                    {overview.revenue.growth !== undefined && (
                      <Badge 
                        variant={overview.revenue.growth >= 0 ? "default" : "destructive"}
                        className={overview.revenue.growth >= 0 ? "bg-green-100 text-green-700 border-green-200" : ""}
                      >
                        {overview.revenue.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(overview.revenue.growth).toFixed(1)}%
                  </Badge>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  TB: {avgDaily.toLocaleString("vi-VN")}₫/ngày
                </p>
                  {overview.revenue.previousPeriod !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Kỳ trước: {overview.revenue.previousPeriod.toLocaleString("vi-VN")}₫
                    </p>
                  )}
              </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đơn hàng</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{overview.orders.total}</p>
                    {overview.orders.growth !== undefined && (
                      <Badge 
                        variant={overview.orders.growth >= 0 ? "default" : "destructive"}
                        className={overview.orders.growth >= 0 ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                      >
                        {overview.orders.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(overview.orders.growth).toFixed(1)}%
                  </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {overview.orders.completed} hoàn thành
                  </p>
                  {overview.orders.previousPeriod !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Kỳ trước: {overview.orders.previousPeriod} đơn
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Khách hàng mới</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{overview.customers.new}</p>
                    {overview.customers.growth !== undefined && (
                      <Badge 
                        variant={overview.customers.growth >= 0 ? "default" : "destructive"}
                        className={overview.customers.growth >= 0 ? "bg-purple-100 text-purple-700 border-purple-200" : ""}
                      >
                        {overview.customers.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(overview.customers.growth).toFixed(1)}%
                  </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {overview.customers.conversionRate.toFixed(1)}% chuyển đổi
                  </p>
                  {overview.customers.previousPeriod !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Kỳ trước: {overview.customers.previousPeriod} khách
                    </p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sản phẩm</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{overview.products.total}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {overview.products.active} đang bán
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {overview.products.soldOut} hết hàng
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different reports */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportTab)}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="payments">Thanh toán</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          <TabsTrigger value="customers">Khách hàng</TabsTrigger>
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {overviewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : overviewError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-red-600">
                  <span>Không thể tải dữ liệu. Vui lòng thử lại sau.</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Revenue Chart with Recharts */}
              {revenueData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Doanh thu {period} ngày qua</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Doanh thu",
                          color: "hsl(221.2, 83.2%, 53.3%)",
                        },
                        orders: {
                          label: "Số đơn",
                          color: "hsl(142.1, 76.2%, 36.3%)",
                        },
                      }}
                      className="h-[400px] w-full"
                    >
                      <BarChart data={revenueByDay.map(d => ({
                        date: d.date.slice(5),
                        revenue: d.revenue,
                        orders: d.orderCount,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right"
                          tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value: any, name: string) => {
                            if (name === 'revenue') {
                              return [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"];
                            }
                            return [value, "Số đơn"];
                          }}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="revenue" 
                          fill="var(--color-revenue)"
                          radius={[8, 8, 0, 0]}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="orders" 
                          stroke="var(--color-orders)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Preview Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Customers Preview */}
                {topCustomersData && topCustomersData.customers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span>Top Khách hàng</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {topCustomersData.customers.slice(0, 5).map((customer, index) => (
                          <div key={customer.userId} className="flex items-center gap-3 p-2 rounded-lg border">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.orderCount} đơn</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{customer.totalSpent.toLocaleString("vi-VN")}₫</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Revenue by Category Preview */}
                {revenueByCategoryData && revenueByCategoryData.revenueByCategory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <span>Doanh thu theo danh mục</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          revenue: {
                            label: "Doanh thu",
                            color: "hsl(221.2, 83.2%, 53.3%)",
                          },
                        }}
                        className="h-[300px] w-full"
                      >
                        <PieChart>
                          <Pie
                            data={revenueByCategoryData.revenueByCategory.slice(0, 5).map(cat => ({
                              name: cat.categoryName,
                              value: cat.totalRevenue,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="var(--color-revenue)"
                            dataKey="value"
                          >
                            {revenueByCategoryData.revenueByCategory.slice(0, 5).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 30}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value: any) => `${Number(value).toLocaleString("vi-VN")}₫`}
                          />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {revenueLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
          ) : revenueData && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Doanh thu {period} ngày qua</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Cao nhất: {revenueData.summary.max.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                      <span>Thấp nhất: {revenueData.summary.min.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-end justify-between gap-2 h-64">
                  {revenueByDay.map((d, index) => {
                    const height = Math.max(8, (d.revenue / maxRevenue) * 240);
                    const isHighest = d.revenue === revenueData.summary.max;
                    const isToday = index === revenueByDay.length - 1;
                
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group">
                        <div className="relative mb-2 w-full">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-80 ${
                          isHighest ? 'bg-gradient-to-t from-blue-500 to-blue-400' :
                          isToday ? 'bg-gradient-to-t from-green-500 to-green-400' :
                          'bg-gradient-to-t from-gray-400 to-gray-300'
                        }`}
                        style={{ height: `${height}px` }}
                      />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {d.revenue.toLocaleString("vi-VN")}₫ ({d.orderCount} đơn)
                      </div>
                    </div>
                    <div className="text-xs text-center">
                      <div className="font-medium">{d.date.slice(5)}</div>
                      <div className="text-gray-500">{new Date(d.date).toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                    </div>
                  </div>
                );
              })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span>Sản phẩm bán chạy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
                {topProductsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredTopProducts.length > 0 ? (
            <div className="space-y-4">
                    {filteredTopProducts.map((product, index) => {
                const rank = index + 1;
                return (
                        <div key={product.productVariantId} className="flex items-center gap-4 p-3 rounded-lg border bg-gray-50/50">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      rank === 2 ? 'bg-gray-100 text-gray-700' :
                      rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rank}
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                            {product.mainImage ? (
                              <img src={product.mainImage} alt={product.productName} className="h-12 w-12 rounded-lg object-cover border" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{product.productName}</div>
                        <div className="text-sm text-gray-500">
                                {product.size?.name || '—'} • {product.basePrice.toLocaleString("vi-VN")}₫
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{product.totalSold}</div>
                            <div className="text-xs text-gray-500">đã bán</div>
                            <div className="text-xs text-green-600 font-medium">
                              {product.totalRevenue.toLocaleString("vi-VN")}₫
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'Không tìm thấy sản phẩm' : 'Không có dữ liệu sản phẩm bán chạy'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rated Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  <span>Sản phẩm đánh giá</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ratedProductsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Top Rated */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold text-sm">Đánh giá cao nhất</span>
                      </div>
                      {filteredTopRated.length > 0 ? (
                        <div className="space-y-3">
                          {filteredTopRated.slice(0, 5).map((product) => (
                            <div key={product.productId} className="flex items-center gap-3 p-3 rounded-lg border">
                              {product.mainImage ? (
                                <img src={product.mainImage} alt={product.productName} className="h-10 w-10 rounded-lg object-cover border" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-sm">{product.productName}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs font-semibold">{product.averageRating}</span>
                                  <span className="text-xs text-gray-500">({product.reviewCount})</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Không có dữ liệu
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom Rated */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <StarOff className="h-4 w-4 text-red-500" />
                        <span className="font-semibold text-sm">Đánh giá thấp nhất</span>
                      </div>
                      {filteredBottomRated.length > 0 ? (
                        <div className="space-y-3">
                          {filteredBottomRated.slice(0, 5).map((product) => (
                            <div key={product.productId} className="flex items-center gap-3 p-3 rounded-lg border">
                              {product.mainImage ? (
                                <img src={product.mainImage} alt={product.productName} className="h-10 w-10 rounded-lg object-cover border" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-sm">{product.productName}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3 w-3 text-red-500 fill-red-500" />
                                  <span className="text-xs font-semibold">{product.averageRating}</span>
                                  <span className="text-xs text-gray-500">({product.reviewCount})</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Không có dữ liệu
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {orderStatsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : orderStatsData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Thống kê đơn hàng {period} ngày qua</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(orderStatsData.stats).map(([status, data]) => (
                    <div key={status} className="p-4 rounded-lg border bg-gray-50">
                      <div className="text-sm font-medium text-gray-600 mb-1">{status}</div>
                      <div className="text-2xl font-bold">{data.count}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {data.totalAmount.toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {paymentStatsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : paymentStatsData && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Trạng thái thanh toán</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(paymentStatsData.statusStats).map(([status, data]) => (
                      <div key={status} className="p-4 rounded-lg border bg-gray-50">
                        <div className="text-sm font-medium text-gray-600 mb-1">{status}</div>
                        <div className="text-2xl font-bold">{data.count}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {data.totalAmount.toLocaleString("vi-VN")}₫
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Phương thức thanh toán</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentStatsData.methodStats.map((method) => (
                      <div key={method.method} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-medium">{method.method}</div>
                          <div className="text-sm text-gray-500">{method.count} đơn</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{method.totalAmount.toLocaleString("vi-VN")}₫</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {ratedProductsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : ratedProductsData && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Đánh giá cao nhất</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredTopRated.length > 0 ? (
                    <div className="space-y-4">
                      {filteredTopRated.map((product) => (
                        <div key={product.productId} className="flex items-center gap-4 p-3 rounded-lg border">
                          {product.mainImage ? (
                            <img src={product.mainImage} alt={product.productName} className="h-16 w-16 rounded-lg object-cover border" />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.productName}</div>
                            <div className="text-sm text-gray-500">{product.skuId}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold">{product.averageRating}</span>
                              </div>
                              <span className="text-sm text-gray-500">({product.reviewCount} đánh giá)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{product.basePrice.toLocaleString("vi-VN")}₫</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'Không tìm thấy sản phẩm' : 'Không có dữ liệu'}
                    </div>
                  )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StarOff className="h-5 w-5 text-red-500" />
                    <span>Đánh giá thấp nhất</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
                  {filteredBottomRated.length > 0 ? (
            <div className="space-y-4">
                      {filteredBottomRated.map((product) => (
                        <div key={product.productId} className="flex items-center gap-4 p-3 rounded-lg border">
                          {product.mainImage ? (
                            <img src={product.mainImage} alt={product.productName} className="h-16 w-16 rounded-lg object-cover border" />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.productName}</div>
                            <div className="text-sm text-gray-500">{product.skuId}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-red-500 fill-red-500" />
                                <span className="font-semibold">{product.averageRating}</span>
                              </div>
                              <span className="text-sm text-gray-500">({product.reviewCount} đánh giá)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{product.basePrice.toLocaleString("vi-VN")}₫</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'Không tìm thấy sản phẩm' : 'Không có dữ liệu'}
                </div>
                  )}
                </CardContent>
              </Card>
                </div>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
                </div>
              </div>
              
          {topCustomersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : topCustomersData && topCustomersData.customers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Top Khách hàng theo chi tiêu ({period} ngày qua)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomersData.customers
                    .filter(c => 
                      !searchQuery || 
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((customer, index) => (
                    <div key={customer.userId} className="flex items-center gap-4 p-4 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                        index === 1 ? 'bg-gray-100 text-gray-700 border-2 border-gray-300' :
                        index === 2 ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {index + 1}
                      </div>
                      {customer.avatar ? (
                        <img src={customer.avatar} alt={customer.name} className="h-12 w-12 rounded-full object-cover border-2" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg truncate">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {customer.orderCount} đơn hàng
                          </Badge>
                          <span className="text-xs text-gray-500">
                            TB: {customer.averageOrderValue.toLocaleString("vi-VN")}₫/đơn
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {customer.totalSpent.toLocaleString("vi-VN")}₫
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Tổng chi tiêu</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? 'Không tìm thấy khách hàng' : 'Chưa có dữ liệu khách hàng'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {revenueByCategoryLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : revenueByCategoryData && revenueByCategoryData.revenueByCategory.length > 0 ? (
            <div className="space-y-6">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Phân bổ doanh thu theo danh mục</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Doanh thu",
                          color: "hsl(221.2, 83.2%, 53.3%)",
                        },
                      }}
                      className="h-[400px] w-full"
                    >
                      <PieChart>
                        <Pie
                          data={revenueByCategoryData.revenueByCategory.map(cat => ({
                            name: cat.categoryName,
                            value: cat.totalRevenue,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="var(--color-revenue)"
                          dataKey="value"
                        >
                          {revenueByCategoryData.revenueByCategory.map((_, index) => {
                            const colors = [
                              'hsl(221.2, 83.2%, 53.3%)',
                              'hsl(142.1, 76.2%, 36.3%)',
                              'hsl(280, 70%, 50%)',
                              'hsl(0, 70%, 50%)',
                              'hsl(30, 70%, 50%)',
                              'hsl(200, 70%, 50%)',
                            ];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
                        </Pie>
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value: any) => `${Number(value).toLocaleString("vi-VN")}₫`}
                        />
                        <Legend />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Doanh thu theo danh mục</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Doanh thu",
                          color: "hsl(221.2, 83.2%, 53.3%)",
                        },
                        orders: {
                          label: "Số đơn",
                          color: "hsl(142.1, 76.2%, 36.3%)",
                        },
                      }}
                      className="h-[400px] w-full"
                    >
                      <BarChart 
                        data={revenueByCategoryData.revenueByCategory.map(cat => ({
                          name: cat.categoryName,
                          revenue: cat.totalRevenue,
                          orders: cat.orderCount,
                          quantity: cat.totalQuantity,
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value: any, name: string) => {
                            if (name === 'revenue') {
                              return [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"];
                            }
                            return [value, name === 'orders' ? 'Số đơn' : 'Số lượng'];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Category List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <span>Chi tiết doanh thu theo danh mục</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueByCategoryData.revenueByCategory.map((cat, index) => {
                      const percentage = (cat.totalRevenue / revenueByCategoryData.totalRevenue) * 100;
                      return (
                        <div key={cat.categoryId} className="p-4 rounded-lg border bg-gray-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-lg">{cat.categoryName}</div>
                                <div className="text-sm text-gray-500">
                                  {cat.orderCount} đơn • {cat.totalQuantity} sản phẩm
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {cat.totalRevenue.toLocaleString("vi-VN")}₫
                              </div>
                              <div className="text-sm text-gray-500">
                                {percentage.toFixed(1)}% tổng doanh thu
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
            </div>
          </CardContent>
        </Card>
      </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có dữ liệu doanh thu theo danh mục</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
