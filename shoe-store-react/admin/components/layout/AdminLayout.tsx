import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/state/auth";
import { toast } from "sonner";
import { 
  BarChart3, 
  Box, 
  Tags, 
  ShoppingCart, 
  Users, 
  Bot, 
  Home,
  Menu,
  X,
  Settings,
  LogOut,
  Bell,
  Search,
  UserCog
} from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      navigate("/auth");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl">
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-200"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden dark:bg-gray-700" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent dark:text-gray-100"
                placeholder="Tìm kiếm..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative"
              >
                <Bell className="h-6 w-6" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                  3
                </Badge>
              </button>

              {/* Profile dropdown */}
              <div className="flex items-center gap-x-2">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-2 text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
                    {user?.name || 'Admin'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      navigate("/auth");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };
  const navigation = [
    { name: 'Tổng quan', href: '/admin', icon: Home, current: false, badge: null },
    { name: 'Sản phẩm', href: '/admin/products', icon: Box, current: false, badge: '156' },
    { name: 'Danh mục', href: '/admin/categories', icon: Tags, current: false, badge: null },
    { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart, current: false, badge: '12' },
    { name: 'Khách hàng', href: '/admin/customers', icon: Users, current: false, badge: '2.1k' },
    { name: 'Người dùng', href: '/admin/users', icon: UserCog, current: false, badge: null },
    { name: 'Chatbot', href: '/admin/chatbot', icon: Bot, current: false, badge: null },
    { name: 'Thống kê', href: '/admin/reports', icon: BarChart3, current: false, badge: null },
  ];

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 dark:bg-gray-800">
      <div className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">OCE Admin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        )}
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold items-center'
                      )
                    }
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <div className="space-y-1">
              <NavLink
                to="/admin/settings"
                className="text-gray-700 hover:text-blue-700 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700"
              >
                <Settings className="h-6 w-6 shrink-0" />
                Cài đặt
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full text-left text-gray-700 hover:text-blue-700 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700"
              >
                <LogOut className="h-6 w-6 shrink-0" />
                Đăng xuất
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export { AdminLayout as default };
