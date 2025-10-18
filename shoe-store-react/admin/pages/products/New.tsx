import { useState } from "react";
import { db } from "../../lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

export default function ProductNew() {
  const nav = useNavigate();
  const categories = db.listCategories();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [brand, setBrand] = useState("");
  const [images, setImages] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [discountPercentage, setDiscount] = useState<number>(0);

  const save = () => {
    if (!title || price <= 0) return;
    db.addProduct({ title, price, stock, brand, images: images.split(",").map(s => s.trim()).filter(Boolean), categoryId, discountPercentage, rating: 4.5 });
    nav("/admin/products");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Thêm sản phẩm</h1>
      <Input placeholder="Tên" value={title} onChange={e => setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Giá" value={price} onChange={e => setPrice(Number(e.target.value))} />
        <Input type="number" placeholder="Số lượng" value={stock} onChange={e => setStock(Number(e.target.value))} />
      </div>
      <Input placeholder="Thương hiệu" value={brand} onChange={e => setBrand(e.target.value)} />
      <Input placeholder="URL hình (phân tách bằng dấu phẩy)" value={images} onChange={e => setImages(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
          <SelectTrigger><SelectValue placeholder="Danh mục" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Khuyến mãi %" value={discountPercentage} onChange={e => setDiscount(Number(e.target.value))} />
      </div>
      <div className="flex gap-2">
        <Button onClick={save}>Lưu</Button>
        <Button variant="outline" onClick={() => nav(-1)}>Hủy</Button>
      </div>
    </div>
  );
}
