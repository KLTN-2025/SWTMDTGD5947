import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package,
  Search,
  Eye,
  DollarSign,
  Calendar,
  User,
  Loader2,
  RefreshCw,
  Filter
} from "lucide-react";
import { 
  useAdminOrders, 
  useUpdateOrderStatus, 
  useCancelOrder,
  getStatusColor,
  getPaymentStatusColor,
  formatPrice,
  type OrderFilters,
  type AdminOrder
} from "../lib/use-admin-orders";

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'SHIPPED', label: 'Đang giao hàng' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'FAILED', label: 'Thất bại' }
];

export default function Orders() {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    per_page: 15,
    sort_by: 'createdAt',
    sort_order: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState('');

  const { data: ordersData, isLoading, error, refetch } = useAdminOrders(filters);
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination;

  // Calculate stats
  const totalOrders = pagination?.total || 0;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const shippingOrders = orders.filter(o => o.status === 'SHIPPED').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    setSelectedOrderId(orderId);
    setSelectedStatus(newStatus);
    setStatusNote('');
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId: selectedOrderId,
        data: { 
          status: selectedStatus as any,
          note: statusNote || `Cập nhật trạng thái thành ${selectedStatus}`
        }
      });
      toast.success('Cập nhật trạng thái thành công');
      setIsStatusDialogOpen(false);
      setStatusNote('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleFilterChange = (key: keyof OrderFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' || value === 'ALL' ? undefined : value,
      page: key !== 'page' ? 1 : (value as number) // Reset page when other filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      per_page: 15,
      sort_by: 'createdAt',
      sort_order: 'desc'
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-gray-500 mb-4">Không thể tải danh sách đơn hàng</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Xử lý và theo dõi tất cả đơn hàng từ API
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
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
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
              <p className="text-xs font-medium text-gray-600">Tổng doanh thu</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Tìm kiếm đơn hàng, khách hàng..." 
                value={filters.search || ''} 
                onChange={e => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select 
              value={filters.status || 'ALL'} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status Filter */}
            <Select 
              value={filters.payment_status || 'ALL'} 
              onValueChange={(value) => handleFilterChange('payment_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả thanh toán</SelectItem>
                {PAYMENT_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách đơn hàng ({pagination?.total || 0})</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: AdminOrder) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">#{order.id}</div>
                        <div className="text-sm text-gray-500">{order.itemsCount} sản phẩm</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {order.customer.avatar ? (
                          <img 
                            src={order.customer.avatar} 
                            alt={order.customer.name}
                            className="h-10 w-10 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                          {order.customer.phone && (
                            <div className="text-xs text-gray-400">{order.customer.phone}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{order.itemsCount}</div>
                        <div className="text-sm text-gray-500">sản phẩm</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">
                            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString("vi-VN", { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-bold text-lg">{formatPrice(order.amount)}</div>
                      <div className="text-sm text-gray-500">{order.paymentMethodDisplay}</div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.statusDisplay}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatusDisplay}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link to={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                        </Link>
                        
                        {order.canConfirm && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                            disabled={updateStatusMutation.isPending}
                          >
                            Xác nhận
                          </Button>
                        )}
                        
                        {order.canShip && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                            disabled={updateStatusMutation.isPending}
                          >
                            Giao hàng
                          </Button>
                        )}
                        
                        {order.canComplete && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                            disabled={updateStatusMutation.isPending}
                          >
                            Hoàn thành
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {orders.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Hiển thị {pagination.from} - {pagination.to} của {pagination.total} đơn hàng
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={pagination.current_page <= 1 || isLoading}
                >
                  Trang trước
                </Button>
                <span className="text-sm">
                  Trang {pagination.current_page} / {pagination.last_page}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={pagination.current_page >= pagination.last_page || isLoading}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === 'CONFIRMED' && 'Xác nhận đơn hàng'}
              {selectedStatus === 'SHIPPED' && 'Giao hàng'}
              {selectedStatus === 'COMPLETED' && 'Hoàn thành đơn hàng'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="note"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={`Nhập ghi chú cho việc ${
                  selectedStatus === 'CONFIRMED' ? 'xác nhận' :
                  selectedStatus === 'SHIPPED' ? 'giao hàng' :
                  selectedStatus === 'COMPLETED' ? 'hoàn thành' : 'cập nhật'
                } đơn hàng...`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleConfirmStatusUpdate}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedStatus === 'CONFIRMED' && 'Xác nhận'}
                {selectedStatus === 'SHIPPED' && 'Giao hàng'}
                {selectedStatus === 'COMPLETED' && 'Hoàn thành'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
