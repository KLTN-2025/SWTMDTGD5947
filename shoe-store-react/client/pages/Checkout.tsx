import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, MapPin, CreditCard, Truck } from 'lucide-react';
import { checkoutApi } from '@/lib/checkout-api';
import { cartApi } from '@/lib/cart-api';
import type { CheckoutCalculation, CheckoutRequest, CartResponse } from '@/lib/api-types';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export default function Checkout() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(true);
  const [calculation, setCalculation] = useState<CheckoutCalculation | null>(null);
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'E_WALLET' | 'BANK_TRANSFER'>('CASH');

  // Load checkout calculation and cart data
  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setIsCalculating(true);
      const [calculationResponse, cartResponse] = await Promise.all([
        checkoutApi.calculateCheckout(),
        cartApi.getCartItems()
      ]);

      if (calculationResponse.status) {
        setCalculation(calculationResponse.data);
      }

      if (cartResponse.status) {
        setCartData(cartResponse.data);
        // Redirect if cart is empty
        if (!cartResponse.data?.cartItems?.length) {
          navigate('/cart');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load checkout data:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      alert('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    try {
      setIsLoading(true);
      
      const checkoutData: CheckoutRequest = {
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod
      };

      const response = await checkoutApi.checkout(checkoutData);

      if (response.status && response.data) {
        // Navigate to order detail page
        navigate(`/orders/${response.data.order.id}`, {
          state: { 
            message: 'Đặt hàng thành công!',
            order: response.data.order 
          }
        });
      } else {
        toast.error(response.message || 'Đặt hàng thất bại');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      
      if (error instanceof ApiError) {
        // Debug: Log error structure
        console.log('ApiError apiMessage:', error.apiMessage);
        console.log('ApiError type:', typeof error.apiMessage);
        
        // Kiểm tra errors array từ backend (format mới)
        const backendErrors = error.getErrorsArray();
        console.log('Backend errors:', backendErrors);
        
        if (backendErrors) {
          backendErrors.forEach((errorMsg: string) => {
            toast.error(errorMsg);
          });
          return;
        }

        // Hiển thị lỗi validation chi tiết (format cũ)
        const validationErrors = error.getValidationErrors();
        if (validationErrors) {
          Object.entries(validationErrors).forEach(([field, messages]) => {
            messages.forEach(message => {
              toast.error(message);
            });
          });
        } else {
          // Hiển thị lỗi chung
          const message = typeof error.apiMessage === 'string' 
            ? error.apiMessage 
            : 'Có lỗi xảy ra khi đặt hàng';
          toast.error(message);
        }
      } else {
        toast.error('Có lỗi xảy ra khi đặt hàng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCalculating) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải thông tin checkout...</span>
        </div>
      </div>
    );
  }

  if (!calculation || !cartData?.cartItems?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-4">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
            <Button onClick={() => navigate('/products')}>
              Tiếp tục mua sắm
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Thanh toán</h1>
        <p className="text-gray-600">Hoàn tất đơn hàng của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Địa chỉ chi tiết *</Label>
                <Textarea
                  id="address"
                  placeholder="Nhập địa chỉ giao hàng đầy đủ (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="CASH" id="cash" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                        <div className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</div>
                      </div>
                      <Badge variant="secondary">Khuyến nghị</Badge>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                  <RadioGroupItem value="E_WALLET" id="ewallet" disabled />
                  <Label htmlFor="ewallet" className="flex-1 cursor-not-allowed">
                    <div>
                      <div className="font-medium">Ví điện tử</div>
                      <div className="text-sm text-gray-600">MoMo, ZaloPay (Sắp có)</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                  <RadioGroupItem value="BANK_TRANSFER" id="bank" disabled />
                  <Label htmlFor="bank" className="flex-1 cursor-not-allowed">
                    <div>
                      <div className="font-medium">Chuyển khoản ngân hàng</div>
                      <div className="text-sm text-gray-600">VNPay, Internet Banking (Sắp có)</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Sản phẩm đặt hàng ({cartData.summary.itemCount} sản phẩm)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartData.cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={item.mainImage || '/placeholder-product.jpg'}
                      alt={item.productVariant?.product?.name || 'Product'}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productVariant?.product?.name}</h4>
                      <p className="text-sm text-gray-600">
                        Size: {item.productVariant?.size?.nameSize} | 
                        Số lượng: {item.quantity}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-600">
                          {formatPrice(item.productVariant?.price || 0)} x {item.quantity}
                        </span>
                        <span className="font-medium">{formatPrice(item.itemTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Total */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Tổng đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Tạm tính ({calculation.totalQuantity} sản phẩm)</span>
                <span>{formatPrice(calculation.subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-1" />
                  <span>Phí vận chuyển</span>
                </div>
                <span>
                  {calculation.shipping === 0 ? (
                    <Badge variant="secondary">Miễn phí</Badge>
                  ) : (
                    formatPrice(calculation.shipping)
                  )}
                </span>
              </div>

              {calculation.tax > 0 && (
                <div className="flex justify-between">
                  <span>Thuế</span>
                  <span>{formatPrice(calculation.tax)}</span>
                </div>
              )}

              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatPrice(calculation.total)}</span>
              </div>

              <Button 
                onClick={handleCheckout}
                disabled={isLoading || !deliveryAddress.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đặt hàng'
                )}
              </Button>

              <p className="text-xs text-gray-600 text-center">
                Bằng cách đặt hàng, bạn đồng ý với 
                <a href="#" className="text-primary hover:underline"> Điều khoản dịch vụ</a> và 
                <a href="#" className="text-primary hover:underline"> Chính sách bảo mật</a> của chúng tôi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
