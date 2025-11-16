import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  AlertTriangle
} from "lucide-react";
import {
  useAdminOrderDetail,
  useUpdateOrderStatus,
  useCancelOrder,
  getStatusColor,
  getPaymentStatusColor,
  formatPrice,
  type UpdateStatusRequest,
  type CancelOrderRequest
} from "../../lib/use-admin-orders";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = parseInt(id || '0');

  const { data: order, isLoading, error } = useAdminOrderDetail(orderId);
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();

  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        data: { 
          status: newStatus as any,
          note: statusNote || `Cập nhật trạng thái thành ${newStatus}`
        }
      });
      setIsStatusDialogOpen(false);
      setStatusNote('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    try {
      await cancelOrderMutation.mutateAsync({
        orderId,
        data: {
          reason: cancelReason,
          note: cancelNote
        }
      });
      setIsCancelDialogOpen(false);
      setCancelReason('');
      setCancelNote('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải chi tiết đơn hàng...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
        <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
        <Button onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Đơn hàng #{order.id}</h1>
            <p className="text-gray-600">
              Đặt hàng lúc {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {order.statusDisplay}
          </Badge>
          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
            {order.paymentStatusDisplay}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 h-5" />
                Sản phẩm đã đặt ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <img
                      src={item.mainImage || "/placeholder-product.jpg"}
                      alt={item.productVariant.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productVariant.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        SKU: {item.productVariant.product.skuId} | Size: {item.productVariant.size.nameSize}
                      </p>
                      {/* Color - hiển thị màu đã chọn */}
                      {item.color && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">Màu:</span>
                          <Badge 
                            variant="outline"
                            className="text-xs"
                            title={item.color.name}
                          >
                            {item.color.name}
                            {item.color.hexCode && (
                              <span className="ml-1 text-muted-foreground">({item.color.hexCode})</span>
                            )}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Số lượng: </span>
                          <span className="font-medium">{item.quantity}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Đơn giá: </span>
                          <span className="font-medium">{formatPrice(item.productVariant.price)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Thành tiền: </span>
                          <span className="font-medium text-primary">{formatPrice(item.itemTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {order.statusTimeline && (
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.statusTimeline.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${step.completed ? "bg-green-500" : "bg-gray-300"}`} />
                      <div className="flex-1">
                        <span className={`text-sm ${step.completed ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                        {step.date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(step.date).toLocaleString("vi-VN")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {order.customer.avatar ? (
                    <img 
                      src={order.customer.avatar} 
                      alt={order.customer.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-lg">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">{order.customer.email}</p>
                    {order.customer.phone && (
                      <p className="text-sm text-gray-500">📞 {order.customer.phone}</p>
                    )}
                    {order.customer.address && (
                      <p className="text-sm text-gray-500">📍 {order.customer.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Thông tin giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.deliveryAddress}</p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Thông tin thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Phương thức:</span>
                  <span>{order.paymentMethodDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạng thái:</span>
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatusDisplay}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(order.amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.canConfirm && (
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedStatus('CONFIRMED');
                      setIsStatusDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Xác nhận đơn hàng
                  </Button>
                )}

                {order.canShip && (
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedStatus('SHIPPED');
                      setIsStatusDialogOpen(true);
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Giao hàng
                  </Button>
                )}

                {order.canComplete && (
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedStatus('COMPLETED');
                      setIsStatusDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Hoàn thành
                  </Button>
                )}

                {order.canCancel && (
                  <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Hủy đơn hàng
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          Hủy đơn hàng
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reason">Lý do hủy *</Label>
                          <Input
                            id="reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Nhập lý do hủy đơn hàng..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="cancelNote">Ghi chú thêm</Label>
                          <Textarea
                            id="cancelNote"
                            value={cancelNote}
                            onChange={(e) => setCancelNote(e.target.value)}
                            placeholder="Ghi chú thêm về việc hủy đơn hàng..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                            Không hủy
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={handleCancelOrder}
                            disabled={cancelOrderMutation.isPending}
                          >
                            {cancelOrderMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Xác nhận hủy
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
                  onClick={() => handleStatusUpdate(selectedStatus)}
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
    </div>
  );
}
