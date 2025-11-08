# Index.tsx Update Summary

## Những gì cần thay đổi:

### 1. Import statements
```typescript
// Thay đổi từ:
import { fetchFeaturedProducts, fetchNewProducts } from "@/lib/api";

// Thành:
import { productApi } from "@/lib/product-api";
import { ProductCard } from "@/components/product/ProductCard";
```

### 2. Query hooks
```typescript
// Thay đổi từ:
const { data: featuredData } = useQuery({ 
  queryKey: ["featured-products"], 
  queryFn: () => fetchFeaturedProducts(8) 
});

// Thành:
const { data: featuredData, isLoading: featuredLoading } = useQuery({
  queryKey: ['featured-products'],
  queryFn: async () => {
    const response = await productApi.getProducts({
      per_page: 8,
      sort_by: 'createdAt',
      sort_order: 'desc'
    });
    return response.data;
  }
});

const products = featuredData?.products || [];
```

### 3. ProductCard rendering
```typescript
// Thay đổi từ:
{featuredData?.products.map((p) => (
  <ProductCard key={p.id} p={p} />
))}

// Thành:
{products.map((product) => (
  <ProductCard key={product.id} product={product} />
))}
```

### 4. Loading state
```typescript
{featuredLoading ? (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="aspect-square bg-muted animate-pulse rounded-lg" />
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
      </div>
    ))}
  </div>
) : (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {products.map((product) => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
)}
```

## File đã sẵn sàng để update
Bạn có thể tự update hoặc tôi sẽ làm. Các thay đổi chính:
1. ✅ Import từ product-api thay vì api cũ
2. ✅ Dùng productApi.getProducts() với params
3. ✅ ProductCard nhận prop `product` thay vì `p`
4. ✅ Thêm loading skeleton
