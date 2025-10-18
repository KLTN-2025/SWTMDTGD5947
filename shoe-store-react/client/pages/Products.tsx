import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "@/lib/api";
import type { Product, ProductsQuery } from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const BRANDS = ["Nike","Adidas","Puma","Converse","Vans","New Balance","Reebok","Asics","Oce"];
const TYPES = ["sneaker","thể thao","công sở","boot"];
const COLORS = ["Đen","Trắng","Xám","Đỏ","Xanh dương","Xanh lá","Vàng","Nâu","Be"];

export default function ProductsPage() {
  const [sp, setSp] = useSearchParams();

  const query: ProductsQuery = useMemo(() => ({
    search: sp.get("search") || undefined,
    brand: sp.get("brand") || undefined,
    type: sp.get("type") || undefined,
    color: sp.get("color") || undefined,
    size: sp.get("size") ? Number(sp.get("size")) : undefined,
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 12,
  }), [sp]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", query],
    queryFn: () => fetchProducts(query),
  });

  const setParam = (k: string, v?: string | number) => {
    const next = new URLSearchParams(sp);
    if (v === undefined || v === "") next.delete(k); else next.set(k, String(v));
    if (k !== "page") next.delete("page"); // reset page on filter changes
    setSp(next, { replace: true });
  };

  const page = Number(sp.get("page") || 1);
  const limit = Number(sp.get("limit") || 12);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Layout>
      <section className="container py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Tất cả sản phẩm</h1>
            <p className="text-muted-foreground">Tìm kiếm và lọc giày theo nhu cầu của bạn.</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Input placeholder="Tìm kiếm" defaultValue={query.search} onKeyDown={(e) => { if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value); }} />
            <Button onClick={() => setParam("search", (document.activeElement as HTMLInputElement)?.value || query.search || "")}>Tìm</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className="md:col-span-3 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Thương hiệu</h3>
              <div className="grid grid-cols-2 gap-2">
                {BRANDS.map((b) => (
                  <Button key={b} variant={query.brand === b ? "default" : "secondary"} onClick={() => setParam("brand", query.brand === b ? undefined : b)}>{b}</Button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Loại giày</h3>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <Button key={t} variant={query.type === t ? "default" : "secondary"} onClick={() => setParam("type", query.type === t ? undefined : t)}>{t}</Button>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Màu sắc</h3>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <Button key={c} variant={query.color === c ? "default" : "secondary"} onClick={() => setParam("color", query.color === c ? undefined : c)}>{c}</Button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="minPrice">Giá từ</Label>
                <Input id="minPrice" type="number" defaultValue={query.minPrice} onBlur={(e) => setParam("minPrice", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <Label htmlFor="maxPrice">Đến</Label>
                <Input id="maxPrice" type="number" defaultValue={query.maxPrice} onBlur={(e) => setParam("maxPrice", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
          </aside>

          <div className="md:col-span-9">
            {isLoading && <div className="py-20 text-center">Đang tải...</div>}
            {error && <div className="py-20 text-center text-destructive">Lỗi tải dữ liệu.</div>}
            {!isLoading && !error && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {data?.products.map((p: Product) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setParam("page", page - 1)}>Trang trước</Button>
              <span className="text-sm">Trang {page} / {totalPages}</span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setParam("page", page + 1)}>Trang sau</Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
