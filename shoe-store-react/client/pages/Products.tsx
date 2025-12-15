import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProductSearch } from "@/hooks/useProducts";
import type { ProductSearchParams } from "@/lib/api-types";
import { ProductCard } from "@/components/product/ProductCard";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { categoryApi } from "@/lib/category-api";
import { ChevronDown, ChevronRight } from "lucide-react";

// These would ideally come from your categories API
const STATUSES = [
  { value: "IN_STOCK", label: "Còn hàng" },
  { value: "SOLD_OUT", label: "Hết hàng" },
  { value: "PRE_SALE", label: "Đặt trước" }
];

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  children?: Category[];
}

export default function ProductsPage() {
  const [sp, setSp] = useSearchParams();
  const { products, pagination, loading, error, searchProducts } = useProductSearch();
  const [searchInput, setSearchInput] = useState(sp.get("search") || "");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Load categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryApi.getCategories();
      return response.data;
    }
  });

  const categories = Array.isArray(categoriesData) 
    ? categoriesData 
    : ((categoriesData as any)?.categories || []);

  // Organize categories into parent-child structure
  const organizedCategories = useMemo(() => {
    const parentCategories: Category[] = [];
    const categoryMap = new Map<number, Category>();

    // First pass: create all category objects
    categories.forEach((cat: Category) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: organize into parent-child structure
    categories.forEach((cat: Category) => {
      const category = categoryMap.get(cat.id);
      if (!category) return;

      if (cat.parentId === null) {
        parentCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      }
    });

    return parentCategories;
  }, [categories]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const searchParams: ProductSearchParams = useMemo(() => ({
    keyword: sp.get("search") || undefined,
    category_id: sp.get("category_id") ? Number(sp.get("category_id")) : undefined,
    status: (sp.get("status") as any) || undefined,
    min_price: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    max_price: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    per_page: sp.get("limit") ? Number(sp.get("limit")) : 12,
    sort_by: (sp.get("sortBy") as any) || 'createdAt',
    sort_order: (sp.get("sortOrder") as any) || 'desc',
  }), [sp]);

  // Search products when params change
  useMemo(() => {
    searchProducts(searchParams);
  }, [searchParams]);

  const setParam = (k: string, v?: string | number) => {
    const next = new URLSearchParams(sp);
    if (v === undefined || v === "") next.delete(k); else next.set(k, String(v));
    if (k !== "page") next.delete("page"); // reset page on filter changes
    setSp(next, { replace: true });
  };

  const page = Number(sp.get("page") || 1);
  const limit = Number(sp.get("limit") || 12);
  const total = pagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleSearch = () => {
    setParam("search", searchInput);
  };

  const selectedCategory = categories.find((cat: Category) => cat.id === searchParams.category_id);

  return (
    <Layout>
      <section className="container py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {selectedCategory ? `Sản phẩm ${selectedCategory.name}` : 'Tất cả sản phẩm'}
            </h1>
            <p className="text-muted-foreground">
              {selectedCategory 
                ? `Khám phá các sản phẩm trong danh mục ${selectedCategory.name}`
                : 'Tìm kiếm và lọc giày theo nhu cầu của bạn.'
              }
            </p>
            {selectedCategory && (
              <div className="mt-2">
                <Badge variant="outline" className="text-sm">
                  Đang lọc: {selectedCategory.name}
                  <button 
                    onClick={() => setParam("category_id", undefined)}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Input 
              placeholder="Tìm kiếm" 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} 
            />
            <Button onClick={handleSearch}>Tìm</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className="md:col-span-3 space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="font-semibold mb-3">Danh mục</h3>
              <div className="space-y-1">
                <Button 
                  variant={!searchParams.category_id ? "default" : "ghost"} 
                  onClick={() => setParam("category_id", undefined)}
                  className="w-full justify-start"
                >
                  Tất cả danh mục
                </Button>
                
                {organizedCategories.map((parentCategory) => (
                  <div key={parentCategory.id} className="space-y-1">
                    <div className="flex items-center gap-1">
                      {parentCategory.children && parentCategory.children.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleCategory(parentCategory.id)}
                        >
                          {expandedCategories.has(parentCategory.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button 
                        variant={searchParams.category_id === parentCategory.id ? "default" : "ghost"} 
                        onClick={() => setParam("category_id", searchParams.category_id === parentCategory.id ? undefined : parentCategory.id)}
                        className={`flex-1 justify-start ${!parentCategory.children?.length ? 'ml-9' : ''}`}
                      >
                        <span className="truncate font-medium">
                          {parentCategory.name}
                        </span>
                        {parentCategory.children && parentCategory.children.length > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {parentCategory.children.length}
                          </Badge>
                        )}
                      </Button>
                    </div>
                    
                    {/* Child categories */}
                    {expandedCategories.has(parentCategory.id) && parentCategory.children && parentCategory.children.length > 0 && (
                      <div className="ml-9 space-y-1 border-l-2 border-muted pl-2">
                        {parentCategory.children.map((childCategory) => (
                          <Button 
                            key={childCategory.id} 
                            variant={searchParams.category_id === childCategory.id ? "default" : "ghost"} 
                            onClick={() => setParam("category_id", searchParams.category_id === childCategory.id ? undefined : childCategory.id)}
                            className="w-full justify-start text-sm"
                            size="sm"
                          >
                            <span className="truncate">
                              {childCategory.name}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-3">Trạng thái</h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <Button 
                    key={status.value} 
                    variant={searchParams.status === status.value ? "default" : "secondary"} 
                    onClick={() => setParam("status", searchParams.status === status.value ? undefined : status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="minPrice">Giá từ</Label>
                <Input 
                  id="minPrice" 
                  type="number" 
                  defaultValue={searchParams.min_price} 
                  onBlur={(e) => setParam("minPrice", e.target.value ? Number(e.target.value) : undefined)} 
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Đến</Label>
                <Input 
                  id="maxPrice" 
                  type="number" 
                  defaultValue={searchParams.max_price} 
                  onBlur={(e) => setParam("maxPrice", e.target.value ? Number(e.target.value) : undefined)} 
                />
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Sắp xếp</h3>
              <div className="space-y-2">
                <Button 
                  variant={searchParams.sort_by === 'name' ? "default" : "secondary"} 
                  onClick={() => setParam("sortBy", "name")}
                  className="w-full justify-start"
                >
                  Theo tên
                </Button>
                <Button 
                  variant={searchParams.sort_by === 'basePrice' ? "default" : "secondary"} 
                  onClick={() => setParam("sortBy", "basePrice")}
                  className="w-full justify-start"
                >
                  Theo giá
                </Button>
                <Button 
                  variant={searchParams.sort_by === 'createdAt' ? "default" : "secondary"} 
                  onClick={() => setParam("sortBy", "createdAt")}
                  className="w-full justify-start"
                >
                  Mới nhất
                </Button>
              </div>
            </div>
          </aside>

          <div className="md:col-span-9">
            {loading && <div className="py-20 text-center">Đang tải...</div>}
            {error && <div className="py-20 text-center text-destructive">{error}</div>}
            {!loading && !error && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                Không tìm thấy sản phẩm nào.
              </div>
            )}

            {pagination && pagination.total > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setParam("page", page - 1)}>Trang trước</Button>
                <span className="text-sm">Trang {page} / {totalPages}</span>
                <Button variant="secondary" disabled={page >= totalPages} onClick={() => setParam("page", page + 1)}>Trang sau</Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
