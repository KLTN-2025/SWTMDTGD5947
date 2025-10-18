import "../client/global.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as AppToaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AdminLayout } from "./components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Chatbot from "./pages/Chatbot";
import Reports from "./pages/Reports";
import ProductNew from "./pages/products/New";
import ProductEdit from "./pages/products/Edit";
import ProductView from "./pages/products/View";
import CategoryNew from "./pages/categories/New";
import CategoryEdit from "./pages/categories/Edit";
import CategoryView from "./pages/categories/View";
import CustomerNew from "./pages/customers/New";
import CustomerEdit from "./pages/customers/Edit";
import CustomerView from "./pages/customers/View";
import OrderView from "./pages/orders/View";

const queryClient = new QueryClient();

function AdminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppToaster />
        <Sonner />
        <BrowserRouter>
          <AdminLayout>
            <Routes>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/products/new" element={<ProductNew />} />
              <Route path="/admin/products/:id" element={<ProductEdit />} />
              <Route path="/admin/products/:id/view" element={<ProductView />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/categories/new" element={<CategoryNew />} />
              <Route path="/admin/categories/:id" element={<CategoryEdit />} />
              <Route path="/admin/categories/:id/view" element={<CategoryView />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/orders/:id" element={<OrderView />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/customers/new" element={<CustomerNew />} />
              <Route path="/admin/customers/:id" element={<CustomerEdit />} />
              <Route path="/admin/customers/:id/view" element={<CustomerView />} />
              <Route path="/admin/chatbot" element={<Chatbot />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </AdminLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("admin-root")!).render(<AdminApp />);
