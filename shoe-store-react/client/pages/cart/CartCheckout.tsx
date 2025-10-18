import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/state/cart";
import { useState } from "react";
import type { PaymentMethod } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CartCheckout() {
  const { items, remove, updateQty, total, placeOrder } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return toast.error("Giỏ hàng trống");
    if (!name || !phone || !address || !city) return toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
    const order = placeOrder({ name, phone, address, city, paymentMethod });
    toast.success("Đặt hàng thành công");
    navigate(`/orders/${order.id}`);
  };

  return (
    <Layout>
      <section className="container py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Giỏ hàng & Thanh toán</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-4">
            {items.length === 0 && <div className="p-6 border rounded-xl">Chưa có sản phẩm trong giỏ hàng.</div>}
            {items.map((i) => (
              <div key={`${i.product.id}-${i.size}`} className="p-4 border rounded-xl flex gap-4 items-center">
                <img src={i.product.images[0] || i.product.thumbnail} alt={i.product.title} className="h-20 w-20 object-cover rounded-md" />
                <div className="flex-1">
                  <div className="font-medium">{i.product.title}</div>
                  <div className="text-sm text-muted-foreground">Size {i.size} • {i.product.brand}</div>
                  <div className="mt-1 font-semibold">{i.product.price.toLocaleString("vi-VN")}₫</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={i.quantity} onChange={(e)=> updateQty(i.product.id, i.size, Math.max(1, parseInt(e.target.value||"1",10)))} className="h-10 w-20 rounded-md border px-3" />
                  <Button variant="secondary" onClick={() => remove(i.product.id, i.size)}>Xoá</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="md:col-span-5">
            <div className="p-6 border rounded-xl bg-card">
              <h3 className="font-semibold mb-4">Thông tin giao hàng</h3>
              <form onSubmit={submit} className="space-y-3">
                <Input placeholder="Họ và tên" value={name} onChange={(e)=> setName(e.target.value)} />
                <Input placeholder="Số điện thoại" value={phone} onChange={(e)=> setPhone(e.target.value)} />
                <Input placeholder="Địa chỉ" value={address} onChange={(e)=> setAddress(e.target.value)} />
                <Input placeholder="Thành phố" value={city} onChange={(e)=> setCity(e.target.value)} />
                <Separator className="my-2" />
                <div>
                  <div className="font-semibold mb-2">Phương thức thanh toán</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setPaymentMethod("cod")} className={`h-10 rounded-md border ${paymentMethod==="cod"?"bg-primary text-primary-foreground border-primary":"bg-secondary text-secondary-foreground"}`}>COD</button>
                    <button type="button" disabled className="h-10 rounded-md border opacity-50" title="Kết nối cổng thanh toán để sử dụng">VNPay</button>
                    <button type="button" disabled className="h-10 rounded-md border opacity-50" title="Kết nối cổng thanh toán để sử dụng">MoMo</button>
                    <button type="button" disabled className="h-10 rounded-md border opacity-50" title="Kết nối cổng thanh toán để sử dụng">PayPal</button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">VNPay, MoMo, PayPal sẽ khả dụng sau khi cấu hình tích hợp.</p>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground">Tổng cộng</div>
                  <div className="text-xl font-bold">{total.toLocaleString("vi-VN")}₫</div>
                </div>
                <Button type="submit" className="w-full" disabled={!items.length}>Đặt hàng</Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
