import { useMemo, useState } from "react";
import { db, OrderStatus } from "../lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package,
  Search,
  Filter,
  Eye,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  TrendingUp
} from "lucide-react";

const STATUS: OrderStatus[] = ["pending", "confirmed", "canceled", "shipping", "delivered"];

const statusConfig = {
  pending: { label: "Chờ xử lý", icon: Clock, color: "text-orange-600", bg: "bg-orange-100", variant: "secondary" as const },
  confirmed: { label: "Đã xác nhận", icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100", variant: "default" as const },
  shipping: { label: "Đang giao", icon: Truck, color: "text-purple-600", bg: "bg-purple-100", variant: "default" as const },
  delivered: { label: "Đã giao", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", variant: "outline" as const },
  canceled: { label: "Đã hủy", icon: XCircle, color: "text-red-600", bg: "bg-red-100", variant: "destructive" as const },
};

export default function Orders() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [version, setVersion] = useState(0);
  
  const orders = db.listOrders();
  const customers = db.listCustomers();
  const products = db.listProducts();
  
  const visible = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = filter === "all" || o.status === filter;
      const customer = customers.find(x => x.id === o.customerId);
      const matchesSearch = searchQuery === "" || 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer?.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, customers, filter, searchQuery]);

  const amount = (orderId: string) => {
    const o = orders.find(x => x.id === orderId)!;
    return o.items.reduce((s, it) => s + it.qty * it.price, 0);
  };

  const setStatus = (id: string, status: OrderStatus) => { 
    db.setOrderStatus(id, status); 
    setVersion(v => v + 1); 
  };

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const shippingOrders = orders.filter(o => o.status === 'shipping').length;
  const totalRevenue = orders.reduce((sum, o) => sum + amount(o.id), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Xử lý và theo dõi tất cả đơn hàng
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs font-medium text-gray-600">Tổng đơn hàng</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-md">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs font-medium text-gray-600">Chờ xử lý</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{shippingOrders}</div>
              <p className="text-xs font-medium text-gray-600">Đang giao hàng</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString("vi-VN")}₫</div>
              <p className="text-xs font-medium text-gray-600">Tổng doanh thu</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Tìm kiếm đơn hàng, khách hàng..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {STATUS.map(s => (
                  <SelectItem key={s} value={s}>
                    {statusConfig[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách đơn hàng ({visible.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(o => {
                  const c = customers.find(x => x.id === o.customerId);
                  const first = o.items[0];
                  const p = first ? products.find(x => x.id === first.productId) : undefined;
                  const config = statusConfig[o.status];
                  
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{o.id.slice(-8).toUpperCase()}</div>
                          <div className="text-sm text-gray-500">{o.items.length} sản phẩm</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c?.avatar ? (
                            <img src={c.avatar} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{c?.name || "Khách vãng lai"}</div>
                            <div className="text-sm text-gray-500">{c?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p?.images?.[0] ? (
                            <img src={p.images[0]} alt={p.title} className="h-12 w-12 rounded-lg object-cover border" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium line-clamp-1">{p?.title || "Sản phẩm"}</div>
                            <div className="text-sm text-gray-500">+{o.items.length - 1} khác</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(o.createdAt).toLocaleTimeString("vi-VN", { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg">{amount(o.id).toLocaleString("vi-VN")}₫</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select value={o.status} onValueChange={(v) => setStatus(o.id, v as OrderStatus)}>
                            <SelectTrigger className="w-40">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <config.icon className={`h-4 w-4 ${config.color}`} />
                                  <span>{config.label}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS.map(s => {
                                const statusConf = statusConfig[s];
                                return (
                                  <SelectItem key={s} value={s}>
                                    <div className="flex items-center gap-2">
                                      <statusConf.icon className={`h-4 w-4 ${statusConf.color}`} />
                                      <span>{statusConf.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/orders/${o.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {visible.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}>
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
