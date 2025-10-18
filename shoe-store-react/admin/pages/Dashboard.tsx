import { db } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Package, ShoppingCart, Users } from "lucide-react";

export default function Dashboard() {
  const rev = db.revenueByDay(7);
  const revenue = rev.reduce((s, d) => s + d.revenue, 0);
  const orders = db.listOrders();
  const customers = db.listCustomers();
  const products = db.listProducts();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground">Tình hình kinh doanh trong tuần gần nhất</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Doanh thu" value={revenue.toLocaleString("vi-VN") + "₫"} icon={<ArrowUpRight className="w-4 h-4" />} />
        <Stat title="Đơn hàng" value={orders.length.toString()} icon={<ShoppingCart className="w-4 h-4" />} />
        <Stat title="Khách hàng" value={customers.length.toString()} icon={<Users className="w-4 h-4" />} />
        <Stat title="Sản phẩm" value={products.length.toString()} icon={<Package className="w-4 h-4" />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu 7 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-xs">
              {rev.map(d => (
                <div key={d.date} className="text-center">
                  <div className="h-20 w-full bg-accent/40 rounded" style={{ height: Math.max(4, (d.revenue / (revenue || 1)) * 80) }} />
                  <div className="mt-1">{d.date.slice(5)}</div>
                  <div className="text-muted-foreground">{d.revenue.toLocaleString("vi-VN")}₫</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {db.topSellers().map(i => (
                <div key={i.title} className="flex items-center justify-between">
                  <div className="truncate mr-2">{i.title}</div>
                  <Badge variant="secondary">{i.sold}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {db.inventory().slice(0,8).map(i => (
                <div key={i.title} className="flex items-center justify-between">
                  <div className="truncate mr-2">{i.title}</div>
                  <Badge variant={i.stock < 5 ? "destructive" : "outline"}>{i.stock}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-3">
        <a href="/admin/products"><Button>Quản lý sản phẩm</Button></a>
        <a href="/admin/orders"><Button variant="secondary">Xử lý đơn hàng</Button></a>
      </div>
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="mt-1 flex items-center gap-2 text-xl font-bold">{value}{icon}</div>
      </CardContent>
    </Card>
  );
}
