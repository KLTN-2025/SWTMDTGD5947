import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useCartApi } from "@/state/cart-api";
import { useAuth } from "@/state/auth";
import { useState } from "react";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  Package,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function Cart() {
  const { user } = useAuth();
  const { 
    cartItems, 
    totalItems, 
    totalAmount, 
    summary,
    isLoading, 
    updateCartItem, 
    deleteCartItem, 
    clearCart 
  } = useCartApi();
  
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    try {
      await updateCartItem(cartItemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleDeleteItem = async (cartItemId: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      await deleteCartItem(cartItemId);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      await clearCart();
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <Layout>
        <section className="container py-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h1 className="text-2xl font-bold mb-2">Đăng nhập để xem giỏ hàng</h1>
            <p className="text-muted-foreground mb-6">
              Bạn cần đăng nhập để xem và quản lý giỏ hàng của mình
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link to="/auth/login">Đăng nhập</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              Giỏ hàng của bạn
            </h1>
            <p className="text-muted-foreground mt-1">
              {totalItems > 0 ? `${totalItems} sản phẩm` : 'Giỏ hàng trống'}
            </p>
          </div>
          
          <Link to="/products" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải giỏ hàng...</p>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
            <p className="text-muted-foreground mb-6">
              Hãy thêm một số sản phẩm vào giỏ hàng để tiếp tục
            </p>
            <Button asChild>
              <Link to="/products">Khám phá sản phẩm</Link>
            </Button>
          </div>
        ) : (
          /* Cart Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Clear Cart Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Sản phẩm trong giỏ</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearCart}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa tất cả
                </Button>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0 relative">
                      {item.mainImage ? (
                        <img
                          src={item.mainImage}
                          alt={item.product_variant.product.name}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-lg border flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Status Indicators */}
                      <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                        {!item.productStatus.isAvailable && (
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <XCircle className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {!item.variantStatus.isInSalePeriod && (
                          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <Clock className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            <Link 
                              to={`/products/${item.product_variant.product.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {item.product_variant.product.name}
                            </Link>
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline">
                              Size: {item.product_variant.size.nameSize}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              SKU: {item.product_variant.product.skuId}
                            </span>
                            
                            {/* Product Status */}
                            <Badge 
                              variant={item.productStatus.isAvailable ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {item.productStatus.status === 'IN_STOCK' ? 'Còn hàng' : 
                               item.productStatus.status === 'SOLD_OUT' ? 'Hết hàng' : 'Đặt trước'}
                            </Badge>
                            
                            {/* Categories */}
                            {item.product_variant.product.categories.slice(0, 2).map((cat) => (
                              <Badge key={cat.id} variant="secondary" className="text-xs">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Price and Quantity */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-lg font-bold text-primary">
                          {item.product_variant.price.toLocaleString('vi-VN')}₫
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.id) || !item.productStatus.isAvailable || !item.variantStatus.isInSalePeriod}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          
                          <span className="w-12 text-center font-medium">
                            {updatingItems.has(item.id) ? '...' : item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id) || !item.productStatus.isAvailable || !item.variantStatus.isInSalePeriod}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right mt-2">
                        <div className="text-sm text-muted-foreground">
                          Tổng: {item.itemTotal.toLocaleString('vi-VN')}₫
                        </div>
                        
                        {/* Variant Status Warning */}
                        {!item.variantStatus.isInSalePeriod && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Ngoài thời gian bán
                          </div>
                        )}
                        
                        {!item.productStatus.isAvailable && (
                          <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Không khả dụng
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <div className="p-6 border rounded-lg bg-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Tóm tắt đơn hàng
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Số sản phẩm:</span>
                      <span className="font-medium">{summary?.itemCount || totalItems}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Tổng số lượng:</span>
                      <span className="font-medium">{summary?.totalQuantity || totalItems}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span className="font-medium">{(summary?.totalAmount || totalAmount).toLocaleString('vi-VN')}{summary?.currency === 'VND' ? '₫' : ` ${summary?.currency || ''}`}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Phí vận chuyển:</span>
                      <span>Miễn phí</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Giảm giá:</span>
                      <span>0₫</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">{(summary?.totalAmount || totalAmount).toLocaleString('vi-VN')}{summary?.currency === 'VND' ? '₫' : ` ${summary?.currency || ''}`}</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button className="w-full" size="lg" asChild>
                      <Link to="/cart/checkout">
                        Tiến hành thanh toán
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/products">
                        Tiếp tục mua sắm
                      </Link>
                    </Button>
                  </div>

                  {/* Shipping Info */}
                  <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500" />
                      <div className="text-sm">
                        <p className="font-medium">Miễn phí vận chuyển</p>
                        <p className="text-muted-foreground">
                          Cho đơn hàng từ 500,000₫
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
