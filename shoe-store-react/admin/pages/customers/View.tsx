import { useEffect, useMemo } from "react";
import { db } from "../../lib/store";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function CustomerView() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const c = db.getCustomer(id!);
  const orders = db.listOrders();
  const products = db.listProducts();
  useEffect(() => { if (!c) nav("/admin/customers"); }, [id]);
  if (!c) return null;

  const his = useMemo(() => orders.filter(o => o.customerId === c.id), [orders, id]);
  const spent = his.reduce((s, o) => s + o.items.reduce((t, it) => t + it.price * it.qty, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết khách hàng</h1>
          <p className="text-muted-foreground">Thông tin và lịch sử mua</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/customers/${c.id}`}><Button>Sửa</Button></Link>
          <Button variant="outline" onClick={() => nav(-1)}>Quay lại</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>{c.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {c.avatar && <img src={c.avatar} alt={c.name} className="w-28 h-28 rounded-full object-cover" />}
            <div className="text-sm text-muted-foreground">{c.email}</div>
            <div className="font-medium">Tổng chi tiêu: {spent.toLocaleString("vi-VN")}₫</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Đơn hàng ({his.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Ảnh</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {his.map(o => {
                  const total = o.items.reduce((s, it) => s + it.price * it.qty, 0);
                  const first = o.items[0];
                  const p = first ? db.getProduct(first.productId) : undefined;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium"><Link to={`/admin/orders/${o.id}`} className="hover:underline">{o.id.slice(-6)}</Link></TableCell>
                      <TableCell>
                        {p?.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="h-10 w-10 rounded object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleString("vi-VN")}</TableCell>
                      <TableCell className="font-medium">{total.toLocaleString("vi-VN")}₫</TableCell>
                      <TableCell>{o.status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
