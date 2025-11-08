import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProductsPage from "./pages/Products";
import AuthPage from "./pages/auth/Auth";
import ProfilePage from "./pages/auth/Profile";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import CartPage from "./pages/cart/CartCheckout";
import OrdersPage from "./pages/orders/Orders";
import OrderDetailPage from "./pages/orders/OrderDetail";
import ProductDetail from "./pages/ProductDetail";
import CategoriesPage from "./pages/Categories";
import { CartProvider } from "./state/cart";
import { AuthProvider } from "./state/auth";

// Admin imports
import { AdminLayout } from "../admin/components/layout/AdminLayout";
import Dashboard from "../admin/pages/Dashboard";
import AdminProducts from "../admin/pages/Products";
import AdminCategories from "../admin/pages/Categories";
import AdminOrders from "../admin/pages/Orders";
import AdminCustomers from "../admin/pages/Customers";
import AdminChatbot from "../admin/pages/Chatbot";
import AdminReports from "../admin/pages/Reports";
import ProductNew from "../admin/pages/products/New";
import ProductEdit from "../admin/pages/products/Edit";
import ProductView from "../admin/pages/products/View";
import CategoryNew from "../admin/pages/categories/New";
import CategoryEdit from "../admin/pages/categories/Edit";
import CategoryView from "../admin/pages/categories/View";
import CustomerNew from "../admin/pages/customers/New";
import CustomerEdit from "../admin/pages/customers/Edit";
import CustomerView from "../admin/pages/customers/View";
import OrderView from "../admin/pages/orders/View";
import AdminUsers from "../admin/pages/Users";
import UserNew from "../admin/pages/users/new";
import UserEdit from "../admin/pages/users/[id]";
import UserView from "../admin/pages/users/[id]/view";
import { useAuth } from "./state/auth";
import { useEffect } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

// Admin Protected Route
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Vui lòng đăng nhập để truy cập trang quản trị");
    } else if (!loading && user && !isAdmin) {
      toast.error("Bạn không có quyền truy cập trang quản trị");
    }
  }, [user, loading, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminProtectedRoute><AdminLayout><Dashboard /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/products" element={<AdminProtectedRoute><AdminLayout><AdminProducts /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/products/new" element={<AdminProtectedRoute><AdminLayout><ProductNew /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/products/:id" element={<AdminProtectedRoute><AdminLayout><ProductEdit /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/products/:id/view" element={<AdminProtectedRoute><AdminLayout><ProductView /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/categories" element={<AdminProtectedRoute><AdminLayout><AdminCategories /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/categories/new" element={<AdminProtectedRoute><AdminLayout><CategoryNew /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/categories/:id" element={<AdminProtectedRoute><AdminLayout><CategoryEdit /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/categories/:id/view" element={<AdminProtectedRoute><AdminLayout><CategoryView /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/orders" element={<AdminProtectedRoute><AdminLayout><AdminOrders /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/orders/:id" element={<AdminProtectedRoute><AdminLayout><OrderView /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/customers" element={<AdminProtectedRoute><AdminLayout><AdminCustomers /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/customers/new" element={<AdminProtectedRoute><AdminLayout><CustomerNew /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/customers/:id" element={<AdminProtectedRoute><AdminLayout><CustomerEdit /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/customers/:id/view" element={<AdminProtectedRoute><AdminLayout><CustomerView /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/users" element={<AdminProtectedRoute><AdminLayout><AdminUsers /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/users/new" element={<AdminProtectedRoute><AdminLayout><UserNew /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/users/:id" element={<AdminProtectedRoute><AdminLayout><UserEdit /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/users/:id/view" element={<AdminProtectedRoute><AdminLayout><UserView /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/chatbot" element={<AdminProtectedRoute><AdminLayout><AdminChatbot /></AdminLayout></AdminProtectedRoute>} />
              <Route path="/admin/reports" element={<AdminProtectedRoute><AdminLayout><AdminReports /></AdminLayout></AdminProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
