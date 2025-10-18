import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/state/cart";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  Phone, 
  User,
  CreditCard,
  ArrowLeft,
  AlertCircle
} from "lucide-react";

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
    case "cho_xu_ly": return <Clock className="w-5 h-5" />;
    case "dang_giao": return <Truck className="w-5 h-5" />;
    case "da_giao": return <CheckCircle className="w-5 h-5" />;
    case "da_huy": return <XCircle className="w-5 h-5" />;
    default: return <Package className="w-5 h-5" />;
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

export default function OrderDetailPage() {
  const { id } = useParams();
  const { orders, cancelOrder } = useCart();
  const navigate = useNavigate();
  const order = orders.find((o) => o.id === id);

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
                {statusLabel(order.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : 
                 order.paymentMethod === "vnpay" ? "VNPay" :
                 order.paymentMethod === "momo" ? "MoMo" : "PayPal"}
              </div>
            </div>
          </div>
          {order.status === "cho_xu_ly" && (
            <Button variant="destructive" onClick={() => { cancelOrder(order.id); navigate(0); }}>
              <XCircle className="w-4 h-4 mr-2" />
              Hủy đơn hàng
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products */}
          <div className="lg:col-span-2 p-6 border rounded-xl bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Sản phẩm đã đặt
            </h3>
            <div className="space-y-4">
              {order.items.map((i, index) => (
                <div key={`${i.product.id}-${i.size}`}>
                  <div className="flex items-center gap-4">
                    <img 
                      src={i.product.images[0] || i.product.thumbnail} 
                      alt={i.product.title} 
                      className="h-20 w-20 object-cover rounded-lg border" 
                    />
                    <div className="flex-1">
                      <div className="font-medium text-lg">{i.product.title}</div>
                      <div className="text-sm text-muted-foreground mb-1">{i.product.brand}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">Size {i.size}</Badge>
                        <span>Số lượng: {i.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Đơn giá</div>
                      <div className="font-medium">{i.product.price.toLocaleString("vi-VN")}₫</div>
                      <div className="text-sm text-muted-foreground">
                        Tổng: {(i.product.price * i.quantity).toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Shipping */}
          <div className="space-y-6">
            {/* Shipping Info */}
            <div className="p-6 border rounded-xl bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Thông tin giao hàng
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{order.shippingAddress.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{order.shippingAddress.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <div>{order.shippingAddress.address}</div>
                    <div className="text-muted-foreground">{order.shippingAddress.city}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <h3 className="font-semibold mb-4">Tổng đơn hàng</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính</span>
                  <span>{order.total.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">{order.total.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <Link to="/orders" className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách đơn hàng
          </Link>
          
          {order.status === "da_giao" && (
            <Link to={`/products/${order.items[0]?.product.id}`}>
              <Button variant="outline">
                Mua lại sản phẩm
              </Button>
            </Link>
          )}
        </div>
      </section>
    </Layout>
  );
}
