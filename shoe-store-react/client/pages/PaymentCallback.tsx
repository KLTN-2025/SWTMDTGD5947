import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/state/auth";

/**
 * Trang xử lý callback sau khi thanh toán VNPay/MoMo
 * Không yêu cầu auth wrapper vì user có thể bị mất session sau redirect từ payment gateway
 * Trang này sẽ tự gọi checkAuth để restore session trước khi navigate
 */
export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth, user, loading } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Bước 1: Gọi checkAuth để restore session từ cookie
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        // Ignore error - user might not be logged in
        console.log("Auth check failed on payment callback, continuing anyway");
      }
      setAuthChecked(true);
    };

    // Đợi một chút để cookie được browser xử lý sau redirect
    const timer = setTimeout(restoreAuth, 300);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // Bước 2: Sau khi auth đã check xong, xử lý redirect
  useEffect(() => {
    if (!authChecked || loading) return;

    const paymentStatus = searchParams.get("payment");
    const orderId = searchParams.get("orderId");
    const error = searchParams.get("error");

    // Đợi thêm một chút để đảm bảo state đã update
    const timer = setTimeout(() => {
      if (paymentStatus === "success" && orderId) {
        toast.success("Thanh toán thành công!");
        // Nếu user đã login, navigate đến order detail
        // Nếu không, vẫn navigate nhưng sẽ bị redirect về login (expected behavior)
        navigate(`/orders/${orderId}`, { replace: true });
      } else if (paymentStatus === "failed") {
        const errorMsg = error === "invalid_signature" 
          ? "Chữ ký không hợp lệ" 
          : "Thanh toán thất bại";
        toast.error(errorMsg);
        navigate("/orders", { replace: true });
      } else {
        // Fallback - redirect to orders
        navigate("/orders", { replace: true });
      }
      setProcessing(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [authChecked, loading, searchParams, navigate]);

  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return null;
}
