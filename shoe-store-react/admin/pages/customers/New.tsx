import { useState } from "react";
import { db } from "../../lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CustomerNew() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const nav = useNavigate();

  const save = () => {
    if (!name || !email) return;
    db.addCustomer({ name, email, avatar });
    nav("/admin/customers");
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Thêm khách hàng</h1>
      <Input placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} />
      <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <Input placeholder="URL ảnh đại diện" value={avatar} onChange={e => setAvatar(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={save}>Lưu</Button>
        <Button variant="outline" onClick={() => nav(-1)}>Hủy</Button>
      </div>
    </div>
  );
}
