import { useState } from "react";
import { db } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Award,
  AlertTriangle,
  Eye,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";

export default function Reports() {
  const [period, setPeriod] = useState("14");
  const [refreshing, setRefreshing] = useState(false);
  
  const byDay = db.revenueByDay(parseInt(period));
  const top = db.topSellers(10);
  const inv = db.inventory();
  const products = db.listProducts();
  const orders = db.listOrders();
  const customers = db.listCustomers();
  
  const revenue = byDay.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = revenue / parseInt(period);
  const maxRevenue = Math.max(...byDay.map(d => d.revenue));
  const minRevenue = Math.min(...byDay.map(d => d.revenue));
  
  // Calculate additional metrics
  const totalProducts = products.length;
  const lowStockCount = inv.filter(i => i.stock < 5).length;
  const outOfStockCount = inv.filter(i => i.stock === 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
  
  // Order analytics
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const conversionRate = customers.length > 0 ? (completedOrders / customers.length * 100) : 0;
  
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  };

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
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày qua</SelectItem>
              <SelectItem value="14">14 ngày qua</SelectItem>
              <SelectItem value="30">30 ngày qua</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{revenue.toLocaleString("vi-VN")}₫</p>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  TB: {avgDaily.toLocaleString("vi-VN")}₫/ngày
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn hàng hoàn thành</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{completedOrders}</p>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8.2%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {pendingOrders} đang chờ xử lý
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tỷ lệ chuyển đổi</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.1%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {customers.length} khách hàng
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Giá trị tồn kho</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{totalInventoryValue.toLocaleString("vi-VN")}₫</p>
                  {lowStockCount > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {lowStockCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {totalProducts} sản phẩm
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
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
                <span>Cao nhất: {maxRevenue.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Thấp nhất: {minRevenue.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-64">
              {byDay.map((d, index) => {
                const height = Math.max(8, (d.revenue / (maxRevenue || 1)) * 240);
                const isHighest = d.revenue === maxRevenue;
                const isToday = index === byDay.length - 1;
                
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group">
                    <div className="relative mb-2">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-80 ${
                          isHighest ? 'bg-gradient-to-t from-blue-500 to-blue-400' :
                          isToday ? 'bg-gradient-to-t from-green-500 to-green-400' :
                          'bg-gradient-to-t from-gray-400 to-gray-300'
                        }`}
                        style={{ height: `${height}px` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.revenue.toLocaleString("vi-VN")}₫
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
          </div>
        </CardContent>
      </Card>

      {/* Analytics Grid */}
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
            <div className="space-y-4">
              {top.map((item, index) => {
                const p = products.find(pp => pp.title === item.title);
                const rank = index + 1;
                
                return (
                  <div key={item.title} className="flex items-center gap-4 p-3 rounded-lg border bg-gray-50/50">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      rank === 2 ? 'bg-gray-100 text-gray-700' :
                      rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rank}
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {p?.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="h-12 w-12 rounded-lg object-cover border" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-sm text-gray-500">
                          {p?.brand || "—"} • {p?.price.toLocaleString("vi-VN")}₫
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">{item.sold}</div>
                      <div className="text-xs text-gray-500">đã bán</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>Tình trạng tồn kho</span>
              </div>
              {lowStockCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lowStockCount} cảnh báo
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stock Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{inv.filter(i => i.stock >= 10).length}</div>
                  <div className="text-sm text-green-700">Đủ hàng</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
                  <div className="text-sm text-orange-700">Sắp hết</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
                  <div className="text-sm text-red-700">Hết hàng</div>
                </div>
              </div>
              
              {/* Low Stock Items */}
              <div className="space-y-3">
                {inv.filter(i => i.stock < 10).slice(0, 8).map(item => {
                  const p = products.find(pp => pp.title === item.title);
                  const isOutOfStock = item.stock === 0;
                  const isLowStock = item.stock < 5 && item.stock > 0;
                  
                  return (
                    <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg border">
                      {p?.images?.[0] ? (
                        <img src={p.images[0]} alt={p?.title || item.title} className="h-10 w-10 rounded-lg object-cover border" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-sm text-gray-500">
                          {p?.brand || "—"} • {p?.price.toLocaleString("vi-VN")}₫
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-lg ${
                          isOutOfStock ? 'text-red-600' :
                          isLowStock ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {item.stock}
                        </div>
                        <div className="text-xs text-gray-500">còn lại</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
