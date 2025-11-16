import React, { useState, useEffect } from 'react';
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Package, Clock, Truck, CheckCircle, XCircle, Calendar, ShoppingBag, Loader2 } from "lucide-react";
import { orderApi } from "@/lib/order-api";
import type { Order } from "@/lib/api-types";
import { formatPrice } from "@/lib/utils";

function statusIcon(status: string) {
  switch (status) {
    case "PENDING": return <Clock className="w-4 h-4" />;
    case "CONFIRMED": return <CheckCircle className="w-4 h-4" />;
    case "SHIPPED": return <Truck className="w-4 h-4" />;
    case "COMPLETED": return <CheckCircle className="w-4 h-4" />;
    case "CANCELLED": return <XCircle className="w-4 h-4" />;
    default: return <Package className="w-4 h-4" />;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab.toUpperCase() as any;
      const response = await orderApi.getOrders({ status, per_page: 20 });
      
      if (response.status && response.data) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      const response = await orderApi.cancelOrder(orderId);
      if (response.status) {
        // Reload orders after cancellation
        loadOrders();
      } else {
        alert(response.message || 'Hủy đơn hàng thất bại');
      }
    } catch (error) {
      console.error('Cancel order failed:', error);
      alert('Có lỗi xảy ra khi hủy đơn hàng');
    }
  };

  return (
    <Layout>
      <section className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Đơn hàng của bạn</h1>
        </div>

        {/* Order Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ xác nhận</TabsTrigger>
            <TabsTrigger value="confirmed">Đã xác nhận</TabsTrigger>
            <TabsTrigger value="shipped">Đang giao</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
            <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Đang tải đơn hàng...</span>
          </div>
        ) : !orders.length ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'all' 
                  ? 'Bạn chưa thực hiện đơn hàng nào. Hãy khám phá các sản phẩm của chúng tôi!'
                  : `Không có đơn hàng nào ở trạng thái này.`
                }
              </p>
              <Link to="/products">
                <Button>Mua sắm ngay</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold text-lg">#{order.id}</div>
                        <Badge variant={statusVariant(order.status)} className="flex items-center gap-1">
                          {statusIcon(order.status)}
                          {order.statusDisplay}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {order.itemCount} sản phẩm
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Thanh toán:</span>
                          <Badge variant="outline" className="text-xs">
                            {order.paymentMethod === "CASH" ? "COD" : order.paymentMethod}
                          </Badge>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="flex items-center gap-2 mb-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <img
                            key={index}
                            src={item.mainImage || '/placeholder-product.jpg'}
                            alt="Product"
                            className="w-10 h-10 object-cover rounded border"
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-xs">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {order.canCancel && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Hủy đơn
                        </Button>
                      )}
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Tổng cộng</div>
                        <div className="text-xl font-bold text-primary">
                          {formatPrice(order.amount)}
                        </div>
                      </div>
                      
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="secondary">
                          Chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
