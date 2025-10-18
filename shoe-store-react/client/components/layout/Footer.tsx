import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
        <div>
          <h3 className="font-semibold mb-3">OCE SHOES</h3>
          <p className="text-sm text-muted-foreground">
            Cửa hàng giày hiện đại với bộ sưu tập mới nhất. Giao diện đẹp, trải nghiệm mượt mà.
          </p>
        </div>
        <div>
          <h4 className="font-medium mb-3">Khám phá</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-primary" to="/products">Sản phẩm</Link></li>
            <li><Link className="hover:text-primary" to="/categories">Danh mục</Link></li>
            <li><Link className="hover:text-primary" to="/orders">Đơn hàng</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-primary" to="/help">Trung tâm trợ giúp</Link></li>
            <li><Link className="hover:text-primary" to="/shipping">Vận chuyển & đổi trả</Link></li>
            <li><Link className="hover:text-primary" to="/contact">Liên hệ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3">Bản tin</h4>
          <p className="text-sm text-muted-foreground mb-3">Nhận ưu đãi độc quyền và ra mắt mới.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input placeholder="Email của bạn" className="flex-1 h-10 px-3 rounded-md border bg-background" />
            <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground">Đăng ký</button>
          </form>
        </div>
      </div>
      <div className="border-t py-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} OCE SHOES. All rights reserved.</div>
    </footer>
  );
}
