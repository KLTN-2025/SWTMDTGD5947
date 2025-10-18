import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/auth";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="container py-8 max-w-xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Tài khoản</h1>
        <Tabs defaultValue="login">
          <TabsList>
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
            <TabsTrigger value="forgot">Quên mật khẩu</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <div className="space-y-3 p-6 border rounded-xl">
              <Input placeholder="Email" value={loginEmail} onChange={(e)=> setLoginEmail(e.target.value)} />
              <Input placeholder="Mật khẩu" type="password" value={loginPw} onChange={(e)=> setLoginPw(e.target.value)} />
              <Button className="w-full" onClick={async ()=> { await login(loginEmail, loginPw); toast.success("Đăng nhập thành công"); navigate("/"); }}>Đăng nhập</Button>
              <Button variant="secondary" className="w-full" onClick={async ()=> { try { await loginWithGoogle(); } catch (e: any) { toast.error("Kết nối Supabase để bật đăng nhập Google"); } }}>Đăng nhập bằng Google</Button>
            </div>
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <div className="space-y-3 p-6 border rounded-xl">
              <Input placeholder="Họ tên" value={name} onChange={(e)=> setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e)=> setEmail(e.target.value)} />
              <Input placeholder="Mật khẩu" type="password" value={pw} onChange={(e)=> setPw(e.target.value)} />
              <Button className="w-full" onClick={async ()=> { await register(name, email, pw); toast.success("Đăng ký thành công"); navigate("/profile"); }}>Tạo tài khoản</Button>
            </div>
          </TabsContent>
          <TabsContent value="forgot" className="mt-4">
            <div className="space-y-3 p-6 border rounded-xl">
              <Input placeholder="Email đăng ký" value={resetEmail} onChange={(e)=> setResetEmail(e.target.value)} />
              <Button className="w-full" onClick={()=> toast.success("Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.")}>Gửi liên kết đặt lại</Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}
