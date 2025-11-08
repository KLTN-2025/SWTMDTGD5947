# Toast Error Handling - Báo cáo sửa lỗi

## 🐛 Vấn đề ban đầu
Toast notifications hiển thị "API Error" thay vì message thực tế từ backend API, ngay cả khi backend trả về status 200 với message cụ thể.

## ✅ Giải pháp đã thực hiện

### 1. **Cải thiện ApiError class** (`client/lib/api-client.ts`)
- Sửa constructor để hiển thị message thực tế từ API thay vì "API Error"
- Xử lý cả validation errors (object) và regular errors (string)
- Thêm method `getAllValidationErrors()` để format tất cả lỗi validation

```typescript
constructor(errorData) {
  // Ưu tiên hiển thị message từ API
  const displayMessage = typeof errorData.message === 'string' 
    ? errorData.message 
    : Object.values(errorData.message)[0]?.[0] || 'Lỗi từ server';
  
  super(displayMessage);
  // ...
}
```

### 2. **Tạo Error Handler Helper** (`admin/lib/error-handler.ts`)
Tạo function `getErrorMessage()` để xử lý error message một cách nhất quán:

```typescript
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiError) {
    // Hiển thị tất cả validation errors nếu có
    if (error.getValidationErrors()) {
      return error.getAllValidationErrors();
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallbackMessage;
}
```

### 3. **Cập nhật tất cả Custom Hooks**
Thay thế `err.message` bằng `getErrorMessage(err, fallbackMessage)` trong:

#### ✅ `admin/lib/use-admin-products.ts`
- fetchProducts
- searchProducts
- createProduct
- updateProduct
- deleteProduct
- deleteProductImage
- useAdminProduct (single product)

#### ✅ `admin/lib/use-admin-categories.ts`
- fetchCategories
- createCategory
- updateCategory
- deleteCategory
- useAdminCategory (single category)

#### ✅ `admin/lib/use-admin-users.ts`
- fetchUsers
- searchUsers
- createUser
- updateUser
- deleteUser
- useAdminUser (single user)
- useRoles (fetch roles)

## 📊 Kết quả

### Trước khi sửa:
```
❌ Toast hiển thị: "API Error"
❌ Không biết lỗi cụ thể là gì
```

### Sau khi sửa:
```
✅ Validation error: "Tên sản phẩm là bắt buộc; Email không hợp lệ"
✅ Regular error: "Sản phẩm không tồn tại"
✅ Network error: "Lỗi kết nối mạng. Vui lòng thử lại."
```

## 🎯 Các màn hình đã có Toast đầy đủ

### ✅ Đã hoàn thiện (4/8 màn):
1. **Products** - Tạo, sửa, xóa, xóa ảnh, tìm kiếm
2. **Categories** - Tạo, sửa, xóa, tìm kiếm
3. **Users** - Tạo, sửa, xóa, tìm kiếm, load roles
4. **Chatbot** - Có toast

### ❌ Chưa có (2/8 màn - dùng local store):
5. **Customers** - Chưa kết nối API thật
6. **Orders** - Chưa kết nối API thật

### ⚪ Không cần (2/8 màn - chỉ xem):
7. **Dashboard** - Chỉ hiển thị
8. **Reports** - Chỉ hiển thị

## 🔍 Cách test

1. Thử tạo sản phẩm với tên trống → Sẽ thấy: "Tên sản phẩm là bắt buộc"
2. Thử tạo user với email không hợp lệ → Sẽ thấy: "Email không hợp lệ"
3. Thử xóa category đang được sử dụng → Sẽ thấy message lỗi cụ thể từ backend
4. Tắt backend và thử load data → Sẽ thấy: "Lỗi kết nối mạng. Vui lòng thử lại."

## 📝 Lưu ý cho Backend

Backend Laravel hiện tại đang trả về HTTP status 200 cho cả lỗi validation. Để cải thiện hơn nữa, nên:

1. Trả về HTTP status code phù hợp:
   - 400 cho validation errors
   - 404 cho not found
   - 500 cho server errors

2. Format response nhất quán:
```php
return response()->json([
    'code' => 400,
    'status' => false,
    'msgCode' => 'VALIDATION_ERROR',
    'message' => $validator->errors()
], 400); // ← Thêm HTTP status code
```

Tuy nhiên, frontend đã xử lý được cả trường hợp backend trả về status 200 với `status: false`.
