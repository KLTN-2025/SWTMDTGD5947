import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, ROLES } from "@/state/auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthPage() {
  const { login, register, loginWithGoogle, sendPasswordResetEmail, checkAuth, loading, user } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show expired session message or Google login error/success
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const error = searchParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
    }

    // Handle Google OAuth success
    const googleSuccess = searchParams.get('google');
    if (googleSuccess === 'success') {
      // Wait a bit for cookie to be set, then check auth and redirect
      setTimeout(async () => {
        try {
          await checkAuth();
          toast.success('Đăng nhập Google thành công!');
          
          // Redirect based on user role
          if (user?.roleId === ROLES.ADMIN) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } catch (error) {
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
        }
      }, 500); // Wait 500ms for cookie to be set
    }
  }, [searchParams]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPw) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setIsLoading(true);
      const loggedInUser = await login(loginEmail, loginPw);
      toast.success("Đăng nhập thành công");
      
      // Redirect based on user role
      if (loggedInUser?.roleId === ROLES.ADMIN) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !userName || !email || !pw) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setIsLoading(true);
      await register(name, userName, email, pw);
      toast.success("Đăng ký thành công");
      
      // Reset form
      setName("");
      setUserName("");
      setEmail("");
      setPw("");
      
      // Redirect to auth page after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      loginWithGoogle();
    } catch (error: any) {
      toast.error("Lỗi đăng nhập Google");
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Vui lòng nhập email");
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(resetEmail);
      toast.success("Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.");
    } catch (error: any) {
      toast.error(error.message || "Gửi email thất bại");
    } finally {
      setIsLoading(false);
    }
  };

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
              <Input 
                placeholder="Email" 
                type="email"
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loading || isLoading}
              />
              <Input 
                placeholder="Mật khẩu" 
                type="password" 
                value={loginPw} 
                onChange={(e) => setLoginPw(e.target.value)}
                disabled={loading || isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button 
                className="w-full" 
                onClick={handleLogin}
                disabled={loading || isLoading}
              >
                {loading || isLoading ? "Đang xử lý..." : "Đăng nhập"}
              </Button>
              {/* <Button 
                variant="secondary" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={loading || isLoading}
              >
                Đăng nhập bằng Google
              </Button> */}
            </div>
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <div className="space-y-3 p-6 border rounded-xl">
              <Input 
                placeholder="Họ tên" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                disabled={loading || isLoading}
              />
              <Input 
                placeholder="Tên đăng nhập" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                disabled={loading || isLoading}
              />
              <Input 
                placeholder="Email" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isLoading}
              />
              <Input 
                placeholder="Mật khẩu" 
                type="password" 
                value={pw} 
                onChange={(e) => setPw(e.target.value)}
                disabled={loading || isLoading}
              />
              <Button 
                className="w-full" 
                onClick={handleRegister}
                disabled={loading || isLoading}
              >
                {loading || isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="forgot" className="mt-4">
            <div className="space-y-3 p-6 border rounded-xl">
              <Input 
                placeholder="Email đăng ký" 
                type="email"
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={loading || isLoading}
              />
              <Button 
                className="w-full" 
                onClick={handlePasswordReset}
                disabled={loading || isLoading}
              >
                {loading || isLoading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
}
