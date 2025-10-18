import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/state/cart";
import { Link } from "react-router-dom";
import { Package, Clock, Truck, CheckCircle, XCircle, Calendar, ShoppingBag } from "lucide-react";

function statusLabel(s: string) {
  switch (s) {
    case "cho_xu_ly": return "Chờ xử lý";
    case "dang_giao": return "Đang giao";
    case "da_giao": return "Đã giao";
    case "da_huy": return "Đã hủy";
    default: return s;
  }
}

function statusIcon(s: string) {
  switch (s) {
    case "cho_xu_ly": return <Clock className="w-4 h-4" />;
    case "dang_giao": return <Truck className="w-4 h-4" />;
    case "da_giao": return <CheckCircle className="w-4 h-4" />;
    case "da_huy": return <XCircle className="w-4 h-4" />;
    default: return <Package className="w-4 h-4" />;
  }
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "cho_xu_ly": return "secondary";
    case "dang_giao": return "default";
    case "da_giao": return "outline";
    case "da_huy": return "destructive";
    default: return "outline";
  }
}

export default function OrdersPage() {
  const { orders, updateOrderStatus } = useCart();
  return (
    <Layout>
      <section className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Đơn hàng của bạn</h1>
        </div>
        
        {!orders.length && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-muted-foreground mb-4">Bạn chưa thực hiện đơn hàng nào. Hãy khám phá các sản phẩm của chúng tôi!</p>
            <Link to="/products">
              <Button>Mua sắm ngay</Button>
            </Link>
          </div>
        )}
        
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="p-6 border rounded-xl bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-semibold text-lg">#{o.id}</div>
                    <Badge variant={statusVariant(o.status)} className="flex items-center gap-1">
                      {statusIcon(o.status)}
                      {statusLabel(o.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {o.items.length} sản phẩm
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Thanh toán:</span>
                      <Badge variant="outline" className="text-xs">
                        {o.paymentMethod === "cod" ? "COD" : 
                         o.paymentMethod === "vnpay" ? "VNPay" :
                         o.paymentMethod === "momo" ? "MoMo" : "PayPal"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {o.status !== "da_giao" && o.status !== "da_huy" && (
                    <Button variant="outline" size="sm" onClick={() => updateOrderStatus(o.id, "da_giao")}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Đánh dấu đã giao
                    </Button>
                  )}
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Tổng cộng</div>
                    <div className="text-xl font-bold text-primary">{o.total.toLocaleString("vi-VN")}₫</div>
                  </div>
                  <Link to={`/orders/${o.id}`}>
                    <Button variant="secondary">
                      Chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
