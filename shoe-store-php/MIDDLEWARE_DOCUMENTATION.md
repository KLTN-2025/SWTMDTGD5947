# Middleware Documentation

## 📋 Tổng quan

Hệ thống có 3 middleware chính để bảo vệ các routes:

1. **authMiddleware** - Kiểm tra user đã đăng nhập (có token)
2. **AdminMiddleware** - Kiểm tra user có role ADMIN
3. **UserMiddleware** - Kiểm tra user có role USER

## 🔐 Chi tiết Middleware

### 1. authMiddleware
**File**: `app/Http/Middleware/authMiddleware.php`

**Chức năng**:
- Kiểm tra có token trong cookie không
- Không kiểm tra role

**Response khi lỗi**:
```json
{
  "code": 401,
  "status": false,
  "msgCode": "UNAUTHORIZED",
  "message": "Bạn chưa đăng nhập"
}
```

**Sử dụng**:
```php
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
```

---

### 2. AdminMiddleware
**File**: `app/Http/Middleware/AdminMiddleware.php`

**Chức năng**:
- Kiểm tra có token trong cookie
- Xác thực token với JWT
- Kiểm tra user có role ADMIN
- Set user vào auth guard

**Response khi lỗi**:

**Chưa đăng nhập**:
```json
{
  "code": 401,
  "status": false,
  "msgCode": "UNAUTHORIZED",
  "message": "Bạn chưa đăng nhập"
}
```

**Token không hợp lệ**:
```json
{
  "code": 401,
  "status": false,
  "msgCode": "UNAUTHORIZED",
  "message": "Token không hợp lệ"
}
```

**Không có quyền ADMIN**:
```json
{
  "code": 403,
  "status": false,
  "msgCode": "FORBIDDEN",
  "message": "Bạn không có quyền truy cập. Chỉ ADMIN mới được phép."
}
```

**Sử dụng**:
```php
// Áp dụng cho toàn bộ admin group
Route::group(['prefix' => 'admin', 'middleware' => ['admin']], function () {
    // All admin routes here
});

// Hoặc cho từng route
Route::get('/admin/dashboard', [DashboardController::class, 'index'])->middleware('admin');
```

---

### 3. UserMiddleware
**File**: `app/Http/Middleware/UserMiddleware.php`

**Chức năng**:
- Kiểm tra có token trong cookie
- Xác thực token với JWT
- Kiểm tra user có role USER
- Set user vào auth guard

**Response khi lỗi**:

**Chưa đăng nhập**:
```json
{
  "code": 401,
  "status": false,
  "msgCode": "UNAUTHORIZED",
  "message": "Bạn chưa đăng nhập"
}
```

**Token không hợp lệ**:
```json
{
  "code": 401,
  "status": false,
  "msgCode": "UNAUTHORIZED",
  "message": "Token không hợp lệ"
}
```

**Không có quyền USER**:
```json
{
  "code": 403,
  "status": false,
  "msgCode": "FORBIDDEN",
  "message": "Bạn không có quyền truy cập. Chỉ USER mới được phép."
}
```

**Sử dụng**:
```php
// Áp dụng cho user routes
Route::group(['prefix' => 'user', 'middleware' => ['user']], function () {
    Route::get('/profile', [UserController::class, 'profile']);
    Route::get('/orders', [OrderController::class, 'myOrders']);
});

// Hoặc cho từng route
Route::get('/cart', [CartController::class, 'index'])->middleware('user');
```

---

## 🎯 Cách sử dụng trong Routes

### Đã được áp dụng:

```php
// routes/api.php

// ============================================================================
// ADMIN ROUTES - Protected by admin middleware
// ============================================================================
Route::group(['prefix' => 'admin', 'middleware' => ['admin']], function () {
    
    // Products Management
    Route::group(['prefix' => 'products'], function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
    });

    // Categories Management
    Route::group(['prefix' => 'categories'], function () {
        // ...
    });

    // Users Management
    Route::group(['prefix' => 'users'], function () {
        // ...
    });
});
```

### Ví dụ thêm USER routes:

```php
// ============================================================================
// USER ROUTES - Protected by user middleware
// ============================================================================
Route::group(['prefix' => 'user', 'middleware' => ['user']], function () {
    
    // Profile
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    
    // Orders
    Route::get('/orders', [OrderController::class, 'myOrders']);
    Route::get('/orders/{id}', [OrderController::class, 'orderDetail']);
    
    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'addItem']);
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']);
});
```

---

## 🔧 Đăng ký Middleware

Middleware đã được đăng ký trong `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'admin' => \App\Http\Middleware\AdminMiddleware::class,
        'user' => \App\Http\Middleware\UserMiddleware::class,
        'auth' => \App\Http\Middleware\authMiddleware::class,
    ]);
})
```

---

## 📊 HTTP Status Codes

| Code | Constant | Ý nghĩa |
|------|----------|---------|
| 200 | SUCCESS | Thành công |
| 400 | BAD_REQUEST | Request không hợp lệ |
| 401 | UNAUTHORIZED | Chưa đăng nhập hoặc token không hợp lệ |
| 403 | FORBIDDEN | Không có quyền truy cập |
| 404 | NOT_FOUND | Không tìm thấy |
| 422 | VALIDATION_ERROR | Lỗi validation |
| 500 | SERVER_ERROR | Lỗi server |

---

## 🧪 Test Middleware

### Test AdminMiddleware:

1. **Không có token**:
```bash
curl -X GET http://localhost:8009/api/admin/products
# Response: 401 - "Bạn chưa đăng nhập"
```

2. **Token không hợp lệ**:
```bash
curl -X GET http://localhost:8009/api/admin/products \
  --cookie "token=invalid_token"
# Response: 401 - "Token không hợp lệ hoặc đã hết hạn"
```

3. **User không phải ADMIN**:
```bash
# Login với USER role, sau đó:
curl -X GET http://localhost:8009/api/admin/products \
  --cookie "token=valid_user_token"
# Response: 403 - "Chỉ ADMIN mới được phép"
```

4. **ADMIN hợp lệ**:
```bash
# Login với ADMIN role, sau đó:
curl -X GET http://localhost:8009/api/admin/products \
  --cookie "token=valid_admin_token"
# Response: 200 - Danh sách products
```

### Test UserMiddleware:

Tương tự như AdminMiddleware nhưng kiểm tra role USER.

---

## 💡 Lưu ý

1. **Token được lưu trong cookie** với tên `token`
2. **Middleware kiểm tra role** dựa trên `$user->role->name`
3. **Constants** được định nghĩa trong `app/Helper/Constants.php`:
   - `Constants::ADMIN = 'ADMIN'`
   - `Constants::USER = 'USER'`
4. **JWT Authentication** sử dụng package `tymon/jwt-auth`
5. **Middleware được áp dụng theo thứ tự**: CORS → Admin/User → Route Handler

---

## 🔄 Luồng xử lý Request

```
Request
  ↓
CORS Middleware (HandleCors)
  ↓
Admin/User Middleware
  ↓ (Kiểm tra token)
  ↓ (Xác thực JWT)
  ↓ (Kiểm tra role)
  ↓ (Set user vào auth)
  ↓
Controller
  ↓
Response
```
