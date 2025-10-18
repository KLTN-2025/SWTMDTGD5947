import { useEffect, useMemo } from "react";
import { db } from "../../lib/store";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function CategoryView() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const item = db.getCategory(id!);
  const products = db.listProducts();
  useEffect(() => { if (!item) nav("/admin/categories"); }, [id]);
  if (!item) return null;
  const list = useMemo(() => products.filter(p => p.categoryId === item.id), [products, id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết danh mục</h1>
          <p className="text-muted-foreground">Thông tin và sản phẩm thuộc danh mục</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/categories/${item.id}`}><Button>Sửa</Button></Link>
          <Button variant="outline" onClick={() => nav(-1)}>Quay lại</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>{item.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {item.image && <img src={item.image} alt={item.name} className="w-full h-44 object-cover rounded" />}
            <div className="text-sm text-muted-foreground">{item.description}</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Sản phẩm ({list.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ảnh</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Giá</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.images[0] ? <img src={p.images[0]} alt={p.title} className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 bg-muted rounded" />}</TableCell>
                    <TableCell className="font-medium"><Link to={`/admin/products/${p.id}/view`} className="hover:underline">{p.title}</Link></TableCell>
                    <TableCell className="font-medium">{p.price.toLocaleString("vi-VN")}₫</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
