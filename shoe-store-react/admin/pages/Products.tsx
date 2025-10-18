import { useMemo, useState } from "react";
import { db } from "../lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

export default function Products() {
  const [q, setQ] = useState("");
  const [version, setVersion] = useState(0);
  const products = db.listProducts();
  const categories = db.listCategories();
  const visible = useMemo(() => products.filter(p => p.title.toLowerCase().includes(q.toLowerCase())), [products, q]);

  const remove = (id: string) => { db.deleteProduct(id); setVersion(v => v + 1); };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          <p className="text-muted-foreground">Danh sách sản phẩm theo dạng bảng để quản lý</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Tìm theo tên" value={q} onChange={e => setQ(e.target.value)} />
          <Link to="/admin/products/new"><Button>Thêm sản phẩm</Button></Link>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Thương hiệu</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>SL</TableHead>
              <TableHead>KM%</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(p => {
              const c = categories.find(x => x.id === p.categoryId);
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.images[0] ? <img src={p.images[0]} alt={p.title} className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-muted" />}</TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">{p.brand}</TableCell>
                  <TableCell>{c?.name || "—"}</TableCell>
                  <TableCell className="font-medium">{p.price.toLocaleString("vi-VN")}₫</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>{p.discountPercentage || 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link to={`/admin/products/${p.id}/view`}><Button size="sm" variant="secondary">Xem</Button></Link>
                    <Link to={`/admin/products/${p.id}`}><Button size="sm">Sửa</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Xóa</Button>
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
