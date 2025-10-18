import { useState } from "react";
import { db } from "../../lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CategoryNew() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const nav = useNavigate();

  const save = () => {
    if (!name) return;
    db.addCategory({ name, description, image });
    nav("/admin/categories");
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Thêm danh mục</h1>
      <Input placeholder="Tên danh mục" value={name} onChange={e => setName(e.target.value)} />
      <Textarea placeholder="Mô tả" value={description} onChange={e => setDescription(e.target.value)} />
      <Input placeholder="URL ảnh" value={image} onChange={e => setImage(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={save}>Lưu</Button>
        <Button variant="outline" onClick={() => nav(-1)}>Hủy</Button>
      </div>
    </div>
  );
}
