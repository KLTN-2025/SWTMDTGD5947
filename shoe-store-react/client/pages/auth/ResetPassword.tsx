import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const { resetPassword, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error("Token không hợp lệ");
      navigate("/auth");
    }
  }, [token, navigate]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!token) {
      toast.error("Token không hợp lệ");
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(password, confirmPassword, token);
      toast.success("Đặt lại mật khẩu thành công");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <Layout>
      <section className="container py-8 max-w-xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Đặt lại mật khẩu</h1>
        <div className="space-y-4 p-6 border rounded-xl">
          <p className="text-sm text-muted-foreground">
            Nhập mật khẩu mới của bạn bên dưới.
          </p>
          <Input 
            placeholder="Mật khẩu mới" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || isLoading}
          />
          <Input 
            placeholder="Xác nhận mật khẩu mới" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || isLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
          />
          <Button 
            className="w-full" 
            onClick={handleResetPassword}
            disabled={loading || isLoading}
          >
            {loading || isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate("/auth")}
            disabled={loading || isLoading}
          >
            Quay lại đăng nhập
          </Button>
        </div>
      </section>
    </Layout>
  );
}
