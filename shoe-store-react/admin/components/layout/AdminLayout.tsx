import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, Box, Tags, ShoppingCart, Users, Bot, Home } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr] bg-background text-foreground">
      <aside className="border-r hidden md:flex md:flex-col p-4 gap-2 bg-sidebar">
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent" />
          <div className="font-extrabold tracking-tight">OCE Admin</div>
        </div>
        <NavItem to="/admin" icon={<Home className="w-4 h-4" />}>Tổng quan</NavItem>
        <NavItem to="/admin/products" icon={<Box className="w-4 h-4" />}>Sản phẩm</NavItem>
        <NavItem to="/admin/categories" icon={<Tags className="w-4 h-4" />}>Danh mục</NavItem>
        <NavItem to="/admin/orders" icon={<ShoppingCart className="w-4 h-4" />}>Đơn hàng</NavItem>
        <NavItem to="/admin/customers" icon={<Users className="w-4 h-4" />}>Khách hàng</NavItem>
        <NavItem to="/admin/chatbot" icon={<Bot className="w-4 h-4" />}>Chatbot</NavItem>
        <NavItem to="/admin/reports" icon={<BarChart3 className="w-4 h-4" />}>Thống kê</NavItem>
        <div className="mt-auto pt-2">
          <a href="/" className="block">
            <Button variant="outline" className="w-full">Về trang khách</Button>
          </a>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur px-4 py-3 flex items-center justify-between">
          <div className="md:hidden font-bold">OCE Admin</div>
          <div className="text-sm text-muted-foreground">Quản trị hệ thống bán giày</div>
        </header>
        <main className="p-4 md:p-6 max-w-[1200px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <NavLink to={to} className={({ isActive }) => cn(
      "flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground",
      isActive && "bg-primary text-primary-foreground hover:bg-primary"
    )}>
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

export { AdminLayout as default };
