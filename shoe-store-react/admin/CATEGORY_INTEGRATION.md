# Tích hợp Quản lý Danh mục với Laravel Backend

## Tổng quan

Đã tích hợp thành công chức năng quản lý danh mục sản phẩm cho trang admin với Laravel backend. Tất cả các trang đã được thiết kế lại để phù hợp với database schema thực tế (chỉ có `name` và `parentId`, không có `image` và `description`).

## Các file đã tạo/cập nhật

### 1. **API Service Layer** (`admin/lib/admin-api.ts`)

Đã thêm `AdminCategoryApi` class với các phương thức:

- `getCategories()` - Lấy danh sách tất cả danh mục
- `getCategory(id)` - Lấy chi tiết một danh mục
- `createCategory(data)` - Tạo danh mục mới
- `updateCategory(id, data)` - Cập nhật danh mục
- `deleteCategory(id)` - Xóa danh mục

**TypeScript Interfaces:**
```typescript
interface AdminCategory {
  id: number;
  name: string;
  parentId?: number | null;
  parent?: AdminCategory | null;
  children?: AdminCategory[];
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryRequest {
  name: string;
  parentId?: number | null;
}

interface UpdateCategoryRequest {
  name?: string;
  parentId?: number | null;
}
```

### 2. **Custom Hooks** (`admin/lib/use-admin-categories.ts`)

Tạo 2 custom hooks để quản lý state:

#### `useAdminCategories()`
Quản lý danh sách danh mục với các chức năng:
- Tự động tải danh sách khi component mount
- `fetchCategories()` - Làm mới danh sách
- `createCategory(data)` - Tạo danh mục mới
- `updateCategory(id, data)` - Cập nhật danh mục
- `deleteCategory(id)` - Xóa danh mục
- Xử lý loading state và error
- Hiển thị toast notifications

#### `useAdminCategory(id)`
Quản lý chi tiết một danh mục:
- Tự động tải dữ liệu khi có id
- `refetch()` - Làm mới dữ liệu
- Xử lý loading state và error

### 3. **Trang Danh sách** (`admin/pages/Categories.tsx`)

**Thay đổi chính:**
- ❌ Xóa: `db.listCategories()` và `db.deleteCategory()`
- ✅ Thêm: `useAdminCategories()` hook
- ✅ Thêm: Loading state với spinner
- ✅ Thêm: Xác nhận trước khi xóa
- ✅ Thêm: Empty state khi chưa có danh mục
- ✅ Thêm: Xử lý lỗi tự động qua toast

**Features:**
- Hiển thị danh sách danh mục với icons và badges
- Hiển thị danh mục cha và số lượng danh mục con
- Xóa danh mục với xác nhận
- Loading spinner khi đang tải dữ liệu
- Icon buttons cho các hành động (Xem, Sửa, Xóa)
- Empty state với icon và hướng dẫn

### 4. **Trang Thêm mới** (`admin/pages/categories/New.tsx`)

**Thay đổi chính:**
- ❌ Xóa: `db.addCategory()`
- ✅ Thêm: `useAdminCategories()` hook
- ✅ Thêm: Async/await cho API call
- ✅ Thêm: Validation cho tên danh mục
- ✅ Thêm: Loading state khi đang lưu
- ✅ Thêm: Disable inputs khi đang lưu

**Features:**
- Form validation (tên bắt buộc)
- Select dropdown cho danh mục cha
- Card layout với Labels và descriptions
- Loading button với spinner
- Tự động trim whitespace
- Xử lý lỗi với toast notification
- Redirect về danh sách sau khi thành công

### 5. **Trang Chỉnh sửa** (`admin/pages/categories/Edit.tsx`)

**Thay đổi chính:**
- ❌ Xóa: `db.getCategory()` và `db.updateCategory()`
- ✅ Thêm: `useAdminCategory(id)` hook
- ✅ Thêm: Async data fetching
- ✅ Thêm: Loading state khi tải và lưu
- ✅ Thêm: Auto-populate form từ API data

**Features:**
- Tự động tải dữ liệu danh mục từ API
- Select dropdown cho danh mục cha với filter (không cho chọn chính nó hoặc con)
- Card layout với Labels và descriptions
- Loading spinner khi đang tải
- Form validation
- Loading button khi đang lưu
- Redirect về danh sách sau khi thành công

### 6. **Trang Chi tiết** (`admin/pages/categories/View.tsx`)

**Thay đổi chính:**
- ❌ Xóa: `db.getCategory()` và `db.listProducts()`
- ✅ Thêm: `useAdminCategory(id)` hook
- ✅ Thêm: `useAdminProducts()` hook
- ✅ Thêm: Filter sản phẩm theo danh mục
- ✅ Thêm: Loading state

**Features:**
- Hiển thị thông tin chi tiết danh mục với hierarchy
- Hiển thị danh mục cha (có thể click để xem)
- Hiển thị danh mục con (có thể click để xem)
- Số lượng sản phẩm trong danh mục
- Danh sách sản phẩm với ảnh, SKU, trạng thái, giá
- Loading spinner khi đang tải
- Empty state khi chưa có sản phẩm
- Link đến trang chi tiết sản phẩm

## API Endpoints sử dụng

Tất cả endpoints đều có prefix `/admin/categories`:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/admin/categories` | Lấy danh sách danh mục |
| GET | `/admin/categories/{id}` | Lấy chi tiết danh mục |
| POST | `/admin/categories` | Tạo danh mục mới |
| POST | `/admin/categories/{id}` | Cập nhật danh mục |
| DELETE | `/admin/categories/{id}` | Xóa danh mục |

## Laravel Backend Routes

Routes đã được định nghĩa trong `routes/api.php`:

```php
Route::group(['prefix' => 'admin/categories'], function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{id}', [CategoryController::class, 'show']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::post('/{id}', [CategoryController::class, 'update']); // For form-data
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
});
```

## Response Format

Tất cả API responses tuân theo format chuẩn:

**Success Response:**
```json
{
  "status": true,
  "code": 200,
  "msgCode": "SUCCESS",
  "message": "Thành công",
  "data": {
    "id": 1,
    "name": "Giày thể thao",
    "description": "Giày dành cho thể thao",
    "image": "https://example.com/image.jpg",
    "createdAt": "2024-01-01T00:00:00.000000Z",
    "updatedAt": "2024-01-01T00:00:00.000000Z"
  }
}
```

**Error Response:**
```json
{
  "status": false,
  "code": 400,
  "msgCode": "VALIDATION_ERROR",
  "message": {
    "name": ["Tên danh mục là bắt buộc"]
  }
}
```

## Error Handling

Tất cả errors được xử lý tự động:

1. **Network errors**: Hiển thị toast "Lỗi kết nối mạng"
2. **Validation errors**: Hiển thị toast với message từ server
3. **404 errors**: Redirect về trang danh sách
4. **500 errors**: Hiển thị toast "Đã có lỗi xảy ra"

## Loading States

Tất cả các trang đều có loading states:

- **Initial loading**: Spinner toàn màn hình
- **Action loading**: Button disabled với spinner
- **Form loading**: Inputs disabled

## User Experience

### Toast Notifications

- ✅ **Thành công**: "Tạo/Cập nhật/Xóa danh mục thành công"
- ❌ **Lỗi**: Hiển thị message cụ thể từ server
- ⚠️ **Warning**: Xác nhận trước khi xóa

### Empty States

- Danh sách trống: "Chưa có danh mục nào"
- Sản phẩm trống: "Chưa có sản phẩm nào trong danh mục này"

## Testing

Để test chức năng:

1. **Danh sách**: Truy cập `/admin/categories`
2. **Thêm mới**: Click "Thêm danh mục"
3. **Chỉnh sửa**: Click "Sửa" trên một danh mục
4. **Xem chi tiết**: Click "Xem" trên một danh mục
5. **Xóa**: Click "Xóa" và xác nhận

## Dependencies

Các thư viện được sử dụng:

- `react-router-dom` - Routing
- `sonner` - Toast notifications
- `lucide-react` - Icons (Loader2)
- `@/components/ui/*` - UI components (Button, Table, Input, etc.)

## Best Practices

1. **Type Safety**: Sử dụng TypeScript interfaces cho tất cả data
2. **Error Handling**: Tất cả API calls đều có try-catch
3. **Loading States**: Hiển thị loading cho tất cả async operations
4. **User Feedback**: Toast notifications cho mọi action
5. **Validation**: Client-side validation trước khi gọi API
6. **Clean Code**: Tách biệt API logic, hooks, và UI components

## Troubleshooting

### Lỗi "Không thể tải danh sách danh mục"
- Kiểm tra Laravel server đang chạy
- Kiểm tra CORS settings
- Kiểm tra authentication token

### Lỗi "Không thể tạo/cập nhật danh mục"
- Kiểm tra validation rules trong Laravel
- Kiểm tra request payload
- Xem Laravel logs

### Danh mục không hiển thị
- Kiểm tra database có dữ liệu
- Kiểm tra API response format
- Kiểm tra console logs

## Next Steps

Có thể mở rộng thêm:

1. **Upload ảnh**: Thay vì URL, cho phép upload file
2. **Pagination**: Phân trang cho danh sách lớn
3. **Search**: Tìm kiếm danh mục
4. **Sort**: Sắp xếp theo tên, ngày tạo
5. **Bulk actions**: Xóa nhiều danh mục cùng lúc
6. **Category hierarchy**: Danh mục con

## Kết luận

Tích hợp đã hoàn thành với đầy đủ chức năng CRUD cho quản lý danh mục. Tất cả các trang đều sử dụng Laravel API, có error handling, loading states, và user feedback tốt.
