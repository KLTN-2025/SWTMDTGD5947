import { useEffect, useState } from "react";
import { db } from "../../lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";

export default function CustomerEdit() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const item = db.getCustomer(id!);
  const [name, setName] = useState(item?.name || "");
  const [email, setEmail] = useState(item?.email || "");
  const [avatar, setAvatar] = useState(item?.avatar || "");

  useEffect(() => { if (!item) nav("/admin/customers"); }, [id]);

  const save = () => {
    if (!id) return;
    db.updateCustomer(id, { name, email, avatar });
    nav("/admin/customers");
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Sửa khách hàng</h1>
      <Input placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} />
      <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <Input placeholder="URL ảnh đại diện" value={avatar} onChange={e => setAvatar(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={save}>Cập nhật</Button>
        <Button variant="outline" onClick={() => nav(-1)}>Hủy</Button>
      </div>
    </div>
  );
}
