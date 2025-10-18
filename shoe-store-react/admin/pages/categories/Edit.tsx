import { useEffect, useState } from "react";
import { db } from "../../lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";

export default function CategoryEdit() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const item = db.getCategory(id!);
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [image, setImage] = useState(item?.image || "");

  useEffect(() => { if (!item) nav("/admin/categories"); }, [id]);

  const save = () => {
    if (!id) return;
    db.updateCategory(id, { name, description, image });
    nav("/admin/categories");
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Sửa danh mục</h1>
      <Input placeholder="Tên danh mục" value={name} onChange={e => setName(e.target.value)} />
      <Textarea placeholder="Mô tả" value={description} onChange={e => setDescription(e.target.value)} />
      <Input placeholder="URL ảnh" value={image} onChange={e => setImage(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={save}>Cập nhật</Button>
        <Button variant="outline" onClick={() => nav(-1)}>Hủy</Button>
      </div>
    </div>
  );
}
