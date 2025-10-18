import { useEffect, useMemo } from "react";
import { db, OrderStatus } from "../../lib/store";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUS: OrderStatus[] = ["pending", "confirmed", "canceled", "shipping", "delivered"];

export default function OrderView() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const orders = db.listOrders();
  const o = orders.find(x => x.id === id);
  const customer = o ? db.getCustomer(o.customerId) : undefined;
  const products = db.listProducts();
  useEffect(() => { if (!o) nav("/admin/orders"); }, [id]);
  if (!o) return null;

  const total = useMemo(() => o.items.reduce((s, it) => s + it.price * it.qty, 0), [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết đơn hàng #{o.id.slice(-6)}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {customer?.avatar ? (
              <img src={customer.avatar} alt={customer.name} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <span className="inline-block h-6 w-6 rounded-full bg-muted" />
            )}
            <span>Khách: {customer?.name}</span>
            <span>•</span>
            <span>{new Date(o.createdAt).toLocaleString("vi-VN")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/orders"><Button variant="outline">Về danh sách</Button></Link>
          <Button onClick={() => nav(0)}>Làm mới</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Sản phẩm</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ảnh</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {o.items.map((it, idx) => {
                  const p = products.find(pp => pp.id === it.productId);
                  const line = it.price * it.qty;
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        {p?.images?.[0] && (
                          <img src={p.images[0]} alt={p.title} className="w-14 h-14 object-cover rounded border" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p?.title}</TableCell>
                      <TableCell>{it.price.toLocaleString("vi-VN")}₫</TableCell>
                      <TableCell>{it.qty}</TableCell>
                      <TableCell className="font-medium">{line.toLocaleString("vi-VN")}₫</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">Tổng cộng</TableCell>
                  <TableCell className="font-bold">{total.toLocaleString("vi-VN")}₫</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Trạng thái</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={o.status} onValueChange={(v) => { db.setOrderStatus(o.id, v as OrderStatus); nav(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {customer && (
              <div className="text-sm text-muted-foreground">
                <div className="font-medium text-foreground">Khách hàng</div>
                <div>{customer.name}</div>
                <div>{customer.email}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
