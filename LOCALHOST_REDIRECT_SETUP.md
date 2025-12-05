# ✅ Redirect về Localhost

## Đã cấu hình

### Frontend URL
```env
FRONTEND_URL=http://localhost:5001 ✅
FRONT_END_URL=http://localhost:5001 ✅
```

### MoMo Redirect
```env
MOMO_REDIRECT_URL=http://localhost:5001/orders ✅
```

### VNPay Return
```env
VNPAY_RETURN_URL=http://localhost:8009/api/payments/vnpay/return ✅
```

## 🔄 Payment Flow

### VNPay
```
1. User checkout → Backend tạo VNPay URL
2. Redirect → VNPay sandbox
3. User thanh toán
4. VNPay callback → http://localhost:8009/api/payments/vnpay/return
5. Backend verify → Update order
6. Redirect → http://localhost:5001/orders/{id}?payment=success ✅
```

### MoMo
```
1. User checkout → Backend tạo MoMo URL
2. Redirect → MoMo sandbox
3. User thanh toán
4. MoMo callback → http://localhost:8009/api/payments/return
5. Backend verify → Update order
6. Redirect → http://localhost:5001/orders/{id}?payment=success ✅
```

## 🧪 Test

### 1. Clear cache
```bash
cd shoe-store-php
php artisan config:clear
```

### 2. Restart backend (nếu đang chạy)
```bash
# Ctrl+C để stop
php artisan serve
```

### 3. Test payment
```
1. Access: http://localhost:5001
2. Checkout với VNPay hoặc MoMo
3. Thanh toán thành công
4. Verify redirect về: http://localhost:5001/orders/{id}?payment=success
```

## 📝 Notes

### Khi nào dùng Ngrok?

**Dùng localhost khi:**
- ✅ Test local development
- ✅ Frontend và Backend cùng máy
- ✅ Không cần share với người khác

**Dùng ngrok khi:**
- 🌐 Cần test trên mobile device
- 🌐 Cần share với client/team
- 🌐 Test webhook từ external services
- 🌐 Demo cho người khác

### Chuyển sang Ngrok

Nếu cần dùng ngrok, uncomment trong `.env`:

```env
# Uncomment dòng này:
FRONTEND_URL=https://240a8f2bd73d.ngrok-free.app

# Comment dòng này:
# FRONTEND_URL=http://localhost:5001

# Update MoMo redirect:
MOMO_REDIRECT_URL=https://240a8f2bd73d.ngrok-free.app/orders
```

Sau đó:
```bash
php artisan config:clear
```

## ✅ Ready!

Bây giờ tất cả payment sẽ redirect về localhost:5001! 🎉
