import { useEffect } from "react";
import { db } from "../../lib/store";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function ProductView() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const p = db.getProduct(id!);
  const c = p?.categoryId ? db.getCategory(p.categoryId) : undefined;
  useEffect(() => { if (!p) nav("/admin/products"); }, [id]);
  if (!p) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết sản phẩm</h1>
          <p className="text-muted-foreground">Mọi thông tin của sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/products/${p.id}`}><Button>Sửa</Button></Link>
          <Button variant="outline" onClick={() => nav(-1)}>Quay lại</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{p.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {p.images.map((src, i) => (
                <img key={i} src={src} alt={p.title} className="w-full h-40 object-cover rounded" />
              ))}
            </div>
            <Table>
              <TableBody>
                <TableRow><TableCell className="font-medium">Thương hiệu</TableCell><TableCell>{p.brand || "—"}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Danh mục</TableCell><TableCell>{c?.name || "—"}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Giá</TableCell><TableCell>{p.price.toLocaleString("vi-VN")}₫</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Số lượng</TableCell><TableCell>{p.stock}</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Khuyến mãi</TableCell><TableCell>{p.discountPercentage || 0}%</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Đánh giá</TableCell><TableCell>{p.rating || "—"}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Hành động</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link to={`/admin/products/${p.id}`}><Button className="w-full">Chỉnh sửa</Button></Link>
            <Button variant="outline" className="w-full" onClick={() => nav("/admin/products")}>Về danh sách</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
