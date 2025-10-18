import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/state/auth";

function AuthButtons() {
  const { user, logout } = useAuth();
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/profile"><Button variant="ghost">Xin chào, {user.name}</Button></Link>
        <Button variant="outline" onClick={logout}>Đăng xuất</Button>
      </div>
    );
  }
  return <Link to="/auth"><Button>Đăng nhập</Button></Link>;
}

export function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  useEffect(() => {
    const existing = searchParams.get("search") || "";
    setQ(existing);
  }, [searchParams]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const usp = new URLSearchParams();
    if (q) usp.set("search", q);
    navigate(`/products${usp.toString() ? `?${usp.toString()}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent" />
            <span className="font-extrabold tracking-tight text-xl">OCE SHOES</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link className="hover:text-primary" to="/">Trang chủ</Link>
            <Link className="hover:text-primary" to="/products">Sản phẩm</Link>
            <Link className="hover:text-primary" to="/categories">Danh mục</Link>
            <Link className="hover:text-primary" to="/orders">Đơn hàng</Link>
          </nav>
        </div>
        <form onSubmit={submit} className="flex-1 max-w-xl hidden md:flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm giày..." />
          <Button type="submit">Tìm</Button>
        </form>
        <div className="flex items-center gap-2">
          <Link to="/cart"><Button variant="secondary">Giỏ hàng</Button></Link>
          <AuthButtons />
        </div>
      </div>
      <div className="container md:hidden p-3">
        <form onSubmit={submit} className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm giày..." />
          <Button type="submit" className="shrink-0">Tìm</Button>
        </form>
      </div>
    </header>
  );
}
