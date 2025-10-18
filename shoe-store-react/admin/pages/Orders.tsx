import { useMemo, useState } from "react";
import { db, OrderStatus } from "../lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const STATUS: OrderStatus[] = ["pending", "confirmed", "canceled", "shipping", "delivered"];

export default function Orders() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [version, setVersion] = useState(0);
  const orders = db.listOrders();
  const customers = db.listCustomers();
  const products = db.listProducts();
  const visible = useMemo(() => orders.filter(o => filter === "all" ? true : o.status === filter), [orders, filter]);

  const amount = (orderId: string) => {
    const o = orders.find(x => x.id === orderId)!;
    return o.items.reduce((s, it) => s + it.qty * it.price, 0);
  };

  const setStatus = (id: string, status: OrderStatus) => { db.setOrderStatus(id, status); setVersion(v => v + 1); };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng</h1>
          <p className="text-muted-foreground">Danh sách đơn, xử lý và cập nhật trạng thái</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Lọc theo trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Ảnh</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(o => {
              const c = customers.find(x => x.id === o.customerId);
              const first = o.items[0];
              const p = first ? products.find(x => x.id === first.productId) : undefined;
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id.slice(-6)}</TableCell>
                  <TableCell>
                    {p?.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="h-10 w-10 rounded object-cover border" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {c?.avatar ? <img src={c.avatar} alt={c.name} className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-muted" />}
                      <div>{c?.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleString("vi-VN")}</TableCell>
                  <TableCell className="font-medium">{amount(o.id).toLocaleString("vi-VN")}₫</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => setStatus(o.id, v as OrderStatus)}>
                      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/orders/${o.id}`}>
                      <Button size="sm" variant="outline">Xem chi tiết</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
