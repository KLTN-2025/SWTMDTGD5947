import { useState } from "react";
import { db } from "../lib/store";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";

export default function Categories() {
  const [version, setVersion] = useState(0);
  const categories = db.listCategories();

  const remove = (id: string) => { db.deleteCategory(id); setVersion(v => v + 1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Danh mục</h1>
          <p className="text-muted-foreground">Danh sách danh mục, chỉnh sửa và xóa</p>
        </div>
        <Link to="/admin/categories/new"><Button>Thêm danh mục</Button></Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  {c.image ? <img src={c.image} alt={c.name} className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.description}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link to={`/admin/categories/${c.id}/view`}><Button size="sm" variant="secondary">Xem</Button></Link>
                  <Link to={`/admin/categories/${c.id}`}><Button size="sm">Sửa</Button></Link>
                  <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>Xóa</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
