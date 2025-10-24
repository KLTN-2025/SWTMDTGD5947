import { db } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  Package, 
  ShoppingCart, 
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function Dashboard() {
  const rev = db.revenueByDay(7);
  const revenue = rev.reduce((s, d) => s + d.revenue, 0);
  const orders = db.listOrders();
  const customers = db.listCustomers();
  const products = db.listProducts();
  
  // Calculate additional metrics - using mock data for demo
  const pendingOrders = Math.floor(Math.random() * 15) + 5;
  const completedOrders = Math.floor(Math.random() * 50) + 20;
  const lowStockProducts = products.filter(p => p.stock < 5).length;
  const totalViews = Math.floor(Math.random() * 10000) + 5000; // Mock data
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Tổng quan tình hình kinh doanh hôm nay</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hệ thống hoạt động tốt
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value={revenue.toLocaleString("vi-VN") + "₫"}
          change="+12.5%"
          changeType="increase"
          icon={<DollarSign className="h-6 w-6" />}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Đơn hàng"
          value={orders.length.toString()}
          change="+8.2%"
          changeType="increase"
          icon={<ShoppingCart className="h-6 w-6" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Khách hàng"
          value={customers.length.toString()}
          change="+3.1%"
          changeType="increase"
          icon={<Users className="h-6 w-6" />}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Lượt xem"
          value={totalViews.toLocaleString()}
          change="+15.3%"
          changeType="increase"
          icon={<Eye className="h-6 w-6" />}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Doanh thu 7 ngày qua
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-xs">
              {rev.map(d => (
                <div key={d.date} className="text-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" 
                    style={{ height: Math.max(8, (d.revenue / (revenue || 1)) * 120) + 'px' }} 
                  />
                  <div className="mt-2 font-medium">{d.date.slice(5)}</div>
                  <div className="text-gray-500">{d.revenue.toLocaleString("vi-VN")}₫</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Trạng thái đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Chờ xử lý</span>
                </div>
                <Badge variant="secondary">{pendingOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Hoàn thành</span>
                </div>
                <Badge variant="outline">{completedOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Hết hàng</span>
                </div>
                <Badge variant="destructive">{lowStockProducts}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products and Inventory */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {db.topSellers().map((item, index) => (
                <div key={item.title} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.floor(Math.random() * 2000000 + 500000).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                  <Badge variant="secondary">{item.sold} bán</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cảnh báo tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {db.inventory().filter(i => i.stock < 10).slice(0, 6).map((item, index) => (
                <div key={item.title} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      SKU: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                  </div>
                  <Badge variant={item.stock < 5 ? "destructive" : "secondary"}>
                    {item.stock} còn lại
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <a href="/admin/products/new">
              <Button className="w-full" variant="default">
                <Package className="h-4 w-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </a>
            <a href="/admin/orders">
              <Button className="w-full" variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Xử lý đơn hàng
              </Button>
            </a>
            <a href="/admin/customers">
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Quản lý khách hàng
              </Button>
            </a>
            <a href="/admin/reports">
              <Button className="w-full" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Xem báo cáo
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  iconColor, 
  iconBg 
}: { 
  title: string; 
  value: string; 
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`${iconBg} ${iconColor} rounded-md p-2`}>
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</p>
        </div>
        <div className="mt-2 flex items-center">
          {changeType === 'increase' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`ml-1 text-sm font-medium ${
            changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
          <span className="ml-1 text-sm text-gray-500">từ tháng trước</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="mt-1 flex items-center gap-2 text-xl font-bold">{value}{icon}</div>
      </CardContent>
    </Card>
  );
}
