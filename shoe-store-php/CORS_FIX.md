# Hướng Dẫn Khắc Phục CORS

## Bước 1: Cập Nhật File .env

Mở file `.env` trong thư mục backend và thêm/cập nhật các dòng sau:

```env
APP_URL=http://localhost:8000

# CORS Configuration
SANCTUM_STATEFUL_DOMAINS=localhost:5001,localhost:3000,localhost:8080,127.0.0.1:5001,127.0.0.1:3000,127.0.0.1:8080

# Session Configuration (quan trọng cho cookies)
SESSION_DOMAIN=localhost
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

## Bước 2: Xóa Cache (Đã chạy)

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## Bước 3: Khởi Động Lại Server

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
php artisan serve --host=0.0.0.0 --port=8000
```

## Bước 4: Khởi Động Lại Frontend

```bash
# Trong thư mục React frontend
# Dừng server (Ctrl+C) nếu đang chạy
# Sau đó chạy lại:
pnpm dev
```

## Kiểm Tra

1. Mở browser: http://localhost:5001
2. Mở DevTools > Network tab
3. Thử đăng nhập
4. Không còn lỗi CORS!

## Nếu Vẫn Còn Lỗi

1. Xóa cookies trong browser (Application > Cookies)
2. Hard refresh (Ctrl+Shift+R)
3. Kiểm tra console logs của cả frontend và backend
