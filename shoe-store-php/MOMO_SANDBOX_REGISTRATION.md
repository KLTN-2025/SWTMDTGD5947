# 🔐 Hướng Dẫn Đăng Ký MoMo Sandbox

## 📋 Tổng Quan

MoMo Sandbox là môi trường test miễn phí của MoMo, cho phép bạn test tích hợp thanh toán mà không cần tiền thật.

---

## 🚀 Các Bước Đăng Ký

### **Bước 1: Truy Cập MoMo Developer Portal**

1. Mở trình duyệt và truy cập: https://developers.momo.vn/
2. Click vào nút **"Đăng ký"** hoặc **"Sign Up"**

### **Bước 2: Tạo Tài Khoản**

1. Điền thông tin:
   - Email (sử dụng email thật để nhận xác thực)
   - Mật khẩu
   - Họ tên
   - Số điện thoại

2. Xác nhận email
   - Kiểm tra hộp thư email
   - Click vào link xác thực từ MoMo

### **Bước 3: Đăng Nhập và Tạo App**

1. Đăng nhập vào Developer Portal
2. Vào mục **"My Apps"** hoặc **"Ứng dụng của tôi"**
3. Click **"Create New App"** hoặc **"Tạo ứng dụng mới"**

### **Bước 4: Điền Thông Tin App**

```
App Name: Shoe Store
Description: E-commerce shoe store application
Category: E-commerce / Retail
Environment: Sandbox (Test)
```

### **Bước 5: Cấu Hình Webhook & Redirect URLs**

Trong phần cấu hình app, điền:

**IPN URL (Webhook):**
```
http://localhost:8009/api/payments/webhook
```
*Lưu ý: Khi deploy production, đổi thành domain thật với HTTPS*

**Return URL:**
```
http://localhost:5001/orders
```
*Lưu ý: Khi deploy production, đổi thành domain thật với HTTPS*

### **Bước 6: Lấy API Credentials**

Sau khi tạo app thành công, bạn sẽ nhận được:

1. **Partner Code** (Mã đối tác)
   - Ví dụ: `MOMOBKUN20180529`
   
2. **Access Key**
   - Ví dụ: `klm05TvNBzhg7h7j`
   
3. **Secret Key** (BẢO MẬT - KHÔNG CHIA SẺ)
   - Ví dụ: `at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa`

---

## ⚙️ Cấu Hình Vào Project

### **1. Mở file `.env`**

```bash
cd shoe-store-php
nano .env
# hoặc mở bằng editor yêu thích
```

### **2. Thêm/Cập nhật các dòng sau:**

```env
# MoMo Payment Gateway - SANDBOX
MOMO_PARTNER_CODE=YOUR_PARTNER_CODE_HERE
MOMO_ACCESS_KEY=YOUR_ACCESS_KEY_HERE
MOMO_SECRET_KEY=YOUR_SECRET_KEY_HERE
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:5001/orders
MOMO_IPN_URL=http://localhost:8009/api/payments/webhook
MOMO_REQUEST_TYPE=captureWallet
```

**Thay thế:**
- `YOUR_PARTNER_CODE_HERE` → Partner Code từ MoMo
- `YOUR_ACCESS_KEY_HERE` → Access Key từ MoMo
- `YOUR_SECRET_KEY_HERE` → Secret Key từ MoMo

### **3. Clear cache và restart server**

```bash
php artisan config:clear
php artisan cache:clear

# Restart server
php artisan serve
```

---

## 🧪 Test Thanh Toán

### **1. Tạo đơn hàng**

1. Truy cập: http://localhost:5001
2. Thêm sản phẩm vào giỏ hàng
3. Vào trang checkout
4. Chọn **"Thanh toán qua ví MoMo"**
5. Nhập địa chỉ giao hàng
6. Click **"Đặt hàng"**

### **2. Thanh toán trên MoMo**

Bạn sẽ được redirect đến trang MoMo với QR code.

**Có 2 cách test:**

#### **Cách 1: Dùng MoMo App (Sandbox)**

1. Tải MoMo App trên điện thoại
2. Đăng nhập bằng tài khoản test (MoMo sẽ cung cấp)
3. Quét QR code
4. Xác nhận thanh toán

#### **Cách 2: Dùng Test Credentials**

MoMo Sandbox thường cung cấp test credentials:
- Test Phone: `0999999999`
- Test OTP: `123456`

### **3. Kiểm tra kết quả**

Sau khi thanh toán:
- ✅ Bạn sẽ được redirect về trang orders
- ✅ Order status sẽ chuyển sang `CONFIRMED`
- ✅ Payment status sẽ chuyển sang `PAID`

---

## 🔍 Debug & Troubleshooting

### **Kiểm tra logs**

```bash
# Laravel logs
tail -f shoe-store-php/storage/logs/laravel.log

# Xem request/response từ MoMo
grep "MoMo" shoe-store-php/storage/logs/laravel.log
```

### **Test webhook thủ công**

```bash
curl -X POST http://localhost:8009/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "partnerCode": "YOUR_PARTNER_CODE",
    "orderId": "TXN1234567890",
    "requestId": "1234567890",
    "amount": "100000",
    "resultCode": 0,
    "message": "Successful",
    "transId": "2547483947",
    "orderInfo": "Test payment",
    "orderType": "momo_wallet",
    "payType": "qr",
    "responseTime": "1234567890",
    "extraData": "",
    "signature": "test_signature"
  }'
```

### **Các lỗi thường gặp**

#### **1. "Mã giao dịch hết hạn"**
- **Nguyên nhân:** Sai Partner Code/Access Key/Secret Key
- **Giải pháp:** Kiểm tra lại credentials trong `.env`

#### **2. "Invalid signature"**
- **Nguyên nhân:** Sai Secret Key hoặc sai format rawHash
- **Giải pháp:** Copy chính xác Secret Key từ MoMo Portal

#### **3. Webhook không được gọi**
- **Nguyên nhân:** IPN URL không accessible từ internet
- **Giải pháp:** 
  - Development: Dùng ngrok để expose localhost
  - Production: Dùng domain thật với HTTPS

#### **4. "Payment URL not found"**
- **Nguyên nhân:** Chưa config MoMo credentials
- **Giải pháp:** Thêm credentials vào `.env` và restart server

---

## 🌐 Expose Localhost với Ngrok (Optional)

Để MoMo có thể gọi webhook về localhost:

### **1. Cài đặt ngrok**

```bash
# macOS
brew install ngrok

# hoặc download từ: https://ngrok.com/download
```

### **2. Chạy ngrok**

```bash
ngrok http 8009
```

Bạn sẽ nhận được URL như: `https://abc123.ngrok.io`

### **3. Cập nhật IPN URL**

Trong `.env`:
```env
MOMO_IPN_URL=https://abc123.ngrok.io/api/payments/webhook
```

Và cập nhật trong MoMo Developer Portal.

---

## 📱 Test với MoMo App

### **1. Tải MoMo App**

- iOS: App Store
- Android: Google Play

### **2. Tạo tài khoản test**

MoMo Sandbox thường cung cấp:
- Test phone numbers
- Test OTP codes
- Fake balance để test

### **3. Quét QR và thanh toán**

1. Mở MoMo App
2. Click "Quét mã"
3. Quét QR code trên trang thanh toán
4. Xác nhận thanh toán

---

## 🔒 Bảo Mật

### **Quan trọng:**

1. **KHÔNG commit `.env` vào Git**
   - File `.env` đã có trong `.gitignore`
   - Chỉ commit `.env.example`

2. **KHÔNG chia sẻ Secret Key**
   - Secret Key là thông tin bảo mật
   - Không gửi qua email, chat, hoặc public

3. **Sử dụng HTTPS trong production**
   - IPN URL phải dùng HTTPS
   - Redirect URL phải dùng HTTPS

4. **Verify signature trong webhook**
   - Code đã implement sẵn
   - Đảm bảo không bỏ qua bước verify

---

## 📚 Tài Liệu Tham Khảo

- **MoMo Developer Portal:** https://developers.momo.vn/
- **API Documentation:** https://developers.momo.vn/v3/docs/payment/api/wallet/onetime
- **Sandbox Guide:** https://developers.momo.vn/v3/docs/payment/guide/sandbox
- **Support:** support@momo.vn

---

## ✅ Checklist

- [ ] Đã đăng ký tài khoản MoMo Developer
- [ ] Đã tạo app trong Developer Portal
- [ ] Đã lấy Partner Code, Access Key, Secret Key
- [ ] Đã thêm credentials vào `.env`
- [ ] Đã chạy `php artisan config:clear`
- [ ] Đã restart Laravel server
- [ ] Đã test checkout với MoMo
- [ ] Đã test thanh toán thành công
- [ ] Đã test thanh toán thất bại
- [ ] Đã kiểm tra webhook hoạt động
- [ ] Đã kiểm tra order status được cập nhật

---

## 💡 Tips

1. **Sandbox vs Production:**
   - Sandbox: Test miễn phí, không cần tiền thật
   - Production: Cần KYC doanh nghiệp, có phí giao dịch

2. **Thời gian xử lý:**
   - Sandbox: Instant (ngay lập tức)
   - Production: 1-3 ngày làm việc để duyệt

3. **Giới hạn:**
   - Sandbox: Không giới hạn số lượng test
   - Production: Có phí theo % giao dịch

4. **Support:**
   - Nếu gặp vấn đề, liên hệ support@momo.vn
   - Cung cấp Partner Code và mô tả lỗi chi tiết

---

**Chúc bạn test thành công! 🎉**
