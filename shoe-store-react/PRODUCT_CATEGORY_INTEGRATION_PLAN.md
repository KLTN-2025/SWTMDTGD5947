# Product & Category Integration Plan

## ✅ Đã hoàn thành

1. **product-api.ts** - Đã cập nhật để sử dụng Laravel API `/products`

## 📋 Cần làm tiếp

### 1. Tạo category-api.ts

```typescript
// client/lib/category-api.ts
import { apiClient } from './api-client';
import { ApiResponse } from './api-types';

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

class CategoryApi {
  private baseUrl = '/categories';

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>(this.baseUrl);
  }

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`${this.baseUrl}/${id}`);
  }
}

export const categoryApi = new CategoryApi();
```

### 2. Cập nhật useProducts hook

```typescript
// client/hooks/useProducts.ts
import { useState, useCallback } from 'react';
import { productApi, Product, ProductSearchParams, PaginationMeta } from '@/lib/product-api';
import { toast } from 'sonner';

export function useProductSearch() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = useCallback(async (params: ProductSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.searchProducts(params);
      if (response.data) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải sản phẩm';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, pagination, loading, error, searchProducts };
}
```

### 3. Cập nhật ProductCard component

```typescript
// Thêm import
import { getImageUrl } from '@/lib/image-utils';

// Trong component, sửa image src
<img 
  src={getImageUrl(product.images[0]?.url)} 
  alt={product.name}
  onError={(e) => {
    e.currentTarget.src = '/placeholder-product.png'; // fallback
  }}
/>
```

### 4. Cập nhật Index.tsx (Trang chủ)

```typescript
// Thay đổi query
const { data: productsData, isLoading } = useQuery({
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

const products = productsData?.products || [];

// Hiển thị
{products.map(product => (
  <ProductCard key={product.id} product={product} />
))}
```

### 5. Cập nhật Products.tsx

Đã có sẵn logic search, chỉ cần đảm bảo:
- `useProductSearch` hook hoạt động với API mới
- ProductCard hiển thị ảnh đúng với `getImageUrl()`
- Pagination hoạt động với `pagination.current_page`, `pagination.last_page`

### 6. Cập nhật Categories.tsx

```typescript
import { categoryApi, Category } from '@/lib/category-api';
import { useQuery } from '@tanstack/react-query';

export default function CategoriesPage() {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryApi.getCategories();
      return response.data;
    }
  });

  const categories = categoriesData || [];

  return (
    <Layout>
      <div className="container py-8">
        <h1>Danh mục sản phẩm</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`/products?category_id=${category.id}`}
              className="p-6 border rounded-lg hover:shadow-lg transition"
            >
              <h3 className="font-semibold">{category.name}</h3>
              {category.children && category.children.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {category.children.length} danh mục con
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
```

## 🎨 Cải thiện UI

### ProductCard với ảnh đẹp hơn

```typescript
<div className="group relative overflow-hidden rounded-lg border bg-card">
  <div className="aspect-square overflow-hidden">
    <img 
      src={getImageUrl(product.images[0]?.url)}
      alt={product.name}
      className="h-full w-full object-cover transition-transform group-hover:scale-105"
      onError={(e) => {
        e.currentTarget.src = '/placeholder.png';
      }}
    />
  </div>
  <div className="p-4">
    <h3 className="font-semibold line-clamp-2">{product.name}</h3>
    <div className="mt-2 flex items-center justify-between">
      <span className="text-lg font-bold text-primary">
        {product.basePrice.toLocaleString('vi-VN')}₫
      </span>
      <Badge variant={
        product.status === 'IN_STOCK' ? 'default' :
        product.status === 'PRE_SALE' ? 'secondary' : 'destructive'
      }>
        {product.status === 'IN_STOCK' ? 'Còn hàng' :
         product.status === 'PRE_SALE' ? 'Đặt trước' : 'Hết hàng'}
      </Badge>
    </div>
  </div>
</div>
```

### Skeleton loading

```typescript
{isLoading ? (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-square" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
) : (
  // Actual products
)}
```

## 🔧 Backend cần có

### ProductController - index() method

```php
public function index(Request $request)
{
    $query = Product::with(['images', 'categories']);
    
    // Pagination
    $perPage = $request->get('per_page', 12);
    $products = $query->paginate($perPage);
    
    return response()->json([
        'code' => 200,
        'status' => true,
        'msgCode' => 'SUCCESS',
        'message' => 'Lấy danh sách sản phẩm thành công',
        'data' => [
            'products' => $products->items(),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ]
        ]
    ]);
}
```

### ProductController - search() method

```php
public function search(Request $request)
{
    $query = Product::with(['images', 'categories']);
    
    // Keyword search
    if ($request->has('keyword')) {
        $query->where('name', 'like', '%' . $request->keyword . '%');
    }
    
    // Status filter
    if ($request->has('status')) {
        $query->where('status', $request->status);
    }
    
    // Category filter
    if ($request->has('category_id')) {
        $query->whereHas('categories', function($q) use ($request) {
            $q->where('categories.id', $request->category_id);
        });
    }
    
    // Price range
    if ($request->has('min_price')) {
        $query->where('basePrice', '>=', $request->min_price);
    }
    if ($request->has('max_price')) {
        $query->where('basePrice', '<=', $request->max_price);
    }
    
    // Sorting
    $sortBy = $request->get('sort_by', 'createdAt');
    $sortOrder = $request->get('sort_order', 'desc');
    $query->orderBy($sortBy, $sortOrder);
    
    // Pagination
    $perPage = $request->get('per_page', 12);
    $products = $query->paginate($perPage);
    
    return response()->json([
        'code' => 200,
        'status' => true,
        'msgCode' => 'SUCCESS',
        'message' => 'Tìm kiếm sản phẩm thành công',
        'data' => [
            'products' => $products->items(),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ]
        ]
    ]);
}
```

## 📝 Checklist

- [ ] Tạo `category-api.ts`
- [ ] Cập nhật `useProducts` hook
- [ ] Cập nhật `ProductCard` với `getImageUrl()`
- [ ] Cập nhật `Index.tsx` để dùng API mới
- [ ] Cập nhật `Products.tsx` để dùng API mới
- [ ] Cập nhật `Categories.tsx` để dùng API mới
- [ ] Test tất cả các trang
- [ ] Thêm loading states
- [ ] Thêm error handling
- [ ] Thêm empty states

## 🎯 Kết quả mong đợi

- Trang chủ hiển thị 8 sản phẩm mới nhất
- Trang sản phẩm có search, filter, pagination
- Trang danh mục hiển thị tất cả categories
- Click vào category → filter products theo category đó
- Tất cả ảnh hiển thị đúng với full URL
- Loading states mượt mà
- Error handling tốt với toast notifications
