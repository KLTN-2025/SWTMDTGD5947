import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/auth";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.avatarUrl || "");
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <section className="container py-8">
          <div className="p-6 border rounded-xl">Bạn chưa đăng nhập. <Link className="text-primary" to="/auth">Đăng nhập</Link></div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-8 max-w-xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Thông tin cá nhân</h1>
        <div className="p-6 border rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            {avatar ? <img src={avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-muted" />}
            <div>
              <div className="font-semibold">{user.email}</div>
              <div className="text-sm text-muted-foreground">ID: {user.id}</div>
            </div>
          </div>
          <Input placeholder="Họ tên" value={name} onChange={(e)=> setName(e.target.value)} />
          <Input placeholder="Avatar URL" value={avatar} onChange={(e)=> setAvatar(e.target.value)} />
          <Button onClick={()=> { updateProfile({ name, avatarUrl: avatar }); toast.success("Cập nhật thành công"); }}>Lưu thay đổi</Button>
        </div>
      </section>
    </Layout>
  );
}
