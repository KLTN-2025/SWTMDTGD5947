import { Layout } from "@/components/layout/Layout";

export default function Placeholder({ title = "Đang phát triển" }: { title?: string }) {
  return (
    <Layout>
      <section className="container py-20 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Trang này sẽ được hoàn thiện theo yêu cầu: đăng ký/đăng nhập (Google OAuth2), giỏ hàng & thanh toán (VNPay, MoMo, PayPal), quản lý đơn hàng, hồ sơ cá nhân, v.v.
          Kết nối Supabase/Neon để lưu trữ dữ liệu và bật xác thực. Hãy nhắn tôi để triển khai các tính năng tiếp theo.
        </p>
      </section>
    </Layout>
  );
}
