import { useMemo, useState } from "react";
import { db } from "../lib/store";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

export default function Customers() {
  const [version, setVersion] = useState(0);
  const customers = db.listCustomers();
  const orders = db.listOrders();

  const stats = useMemo(() => customers.map(c => {
    const his = orders.filter(o => o.customerId === c.id);
    const spent = his.reduce((s, o) => s + o.items.reduce((t, it) => t + it.price * it.qty, 0), 0);
    return { id: c.id, name: c.name, email: c.email, avatar: c.avatar, orders: his.length, spent };
  }), [customers, orders]);

  const remove = (id: string) => { db.deleteCustomer(id); setVersion(v => v + 1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khách hàng</h1>
          <p className="text-muted-foreground">Danh sách, chỉnh sửa, xóa khách hàng</p>
        </div>
        <Link to="/admin/customers/new"><Button>Thêm khách hàng</Button></Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Đơn</TableHead>
              <TableHead>Chi tiêu</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {r.avatar ? <img src={r.avatar} alt={r.name} className="h-9 w-9 rounded-full object-cover" /> : <div className="h-9 w-9 rounded-full bg-muted" />}
                    <div className="font-medium">{r.name}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.email}</TableCell>
                <TableCell>{r.orders}</TableCell>
                <TableCell className="font-medium">{r.spent.toLocaleString("vi-VN")}₫</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link to={`/admin/customers/${r.id}/view`}><Button size="sm" variant="secondary">Xem</Button></Link>
                  <Link to={`/admin/customers/${r.id}`}><Button size="sm">Sửa</Button></Link>
                  <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>Xóa</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
