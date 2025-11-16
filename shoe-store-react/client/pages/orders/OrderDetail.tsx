import React, { useState, useEffect } from 'react';
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { orderApi } from "@/lib/order-api";
import type { Order } from "@/lib/api-types";
import { formatPrice } from "@/lib/utils";
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  CreditCard,
  ArrowLeft,
  AlertCircle,
  Loader2
} from "lucide-react";

function statusIcon(status: string) {
  switch (status) {
    case "PENDING": return <Clock className="w-5 h-5" />;
    case "CONFIRMED": return <CheckCircle className="w-5 h-5" />;
    case "SHIPPED": return <Truck className="w-5 h-5" />;
    case "COMPLETED": return <CheckCircle className="w-5 h-5" />;
    case "CANCELLED": return <XCircle className="w-5 h-5" />;
    default: return <Package className="w-5 h-5" />;
  }
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PENDING": return "secondary";
    case "CONFIRMED": return "default";
    case "SHIPPED": return "default";
    case "COMPLETED": return "outline";
    case "CANCELLED": return "destructive";
    default: return "outline";
  }
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetail(parseInt(id));
    }
  }, [id]);

  const loadOrderDetail = async (orderId: number) => {
    try {
      setIsLoading(true);
      const response = await orderApi.getOrderDetail(orderId);
      
      if (response.status && response.data) {
        setOrder(response.data.order);
      } else {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to load order detail:', error);
      navigate('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await orderApi.cancelOrder(order.id);
      
      if (response.status) {
        await loadOrderDetail(order.id);
      } else {
        alert(response.message || 'Hủy đơn hàng thất bại');
      }
    } catch (error) {
      console.error('Cancel order failed:', error);
      alert('Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Đang tải chi tiết đơn hàng...</span>
          </div>
        </section>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <section className="container py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-muted-foreground mb-4">Đơn hàng bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/orders">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại danh sách
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">Đơn hàng #{order.id}</h1>
              <Badge variant={statusVariant(order.status)} className="flex items-center gap-1">
                {statusIcon(order.status)}
                {order.statusDisplay}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                {order.paymentMethod === "CASH" ? "Thanh toán khi nhận hàng" : order.paymentMethod}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/orders">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            {order.canCancel && (
              <Button 
                variant="destructive" 
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Hủy đơn hàng
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2 p-6 border rounded-xl bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Sản phẩm đã đặt
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <img
                    src={item.mainImage || "/placeholder-product.jpg"}
                    alt={item.productVariant?.product?.name || 'Product'}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productVariant?.product?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.productVariant?.product?.skuId} | Size: {item.productVariant?.size?.nameSize}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Số lượng: </span>
                        <span className="font-medium">{item.quantity}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Đơn giá: </span>
                        <span className="font-medium">{formatPrice(item.productVariant?.price || 0)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Thành tiền: </span>
                        <span className="font-medium text-primary">{formatPrice(item.itemTotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Info */}
          <div className="space-y-6">
            {/* Shipping Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Thông tin giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="font-medium mb-2">Địa chỉ giao hàng:</p>
                  <p className="text-muted-foreground">{order.deliveryAddress}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Tổng kết đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(order.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>Miễn phí</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">{formatPrice(order.amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            {order.statusTimeline && (
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái đơn hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.statusTimeline.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${step.completed ? "bg-green-500" : "bg-muted"}`} />
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
        </div>

      </section>
    </Layout>
  );
}
