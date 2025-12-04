# ⏰ Tự Động Hủy Đơn Hàng Chưa Thanh Toán

## 📋 Tổng Quan

Hệ thống tự động hủy các đơn hàng chưa thanh toán sau **1 giờ** kể từ khi tạo đơn.

---

## 🎯 Mục Đích

1. **Giải phóng stock**: Hoàn lại số lượng sản phẩm cho khách khác
2. **Tránh đơn rác**: Xóa các đơn hàng không hoàn tất thanh toán
3. **Tối ưu trải nghiệm**: User có thể retry payment trong 1 giờ

---

## 🔄 Flow Hoạt Động

### **Khi User Checkout**

```
1. User chọn thanh toán MoMo
2. Backend tạo order (status: P, paymentStatus: PENDING)
3. Backend tạo payment URL
4. User được redirect đến MoMo
```

### **Trường Hợp 1: Thanh Toán Thành Công**

```
1. User thanh toán trên MoMo
2. MoMo gọi webhook với resultCode = 0
3. Backend cập nhật:
   - order.status → CONFIRMED
   - order.paymentStatus → PAID
   - payment.status → PAID
4. User được redirect về trang orders
5. ✅ Đơn hàng hoàn tất
```

### **Trường Hợp 2: Thanh Toán Thất Bại/Hủy**

```
1. User gặp lỗi hoặc hủy thanh toán
2. User quay về trang order detail
3. Thấy nút "Thanh toán lại" (nếu còn < 1 giờ)
4. User có thể retry payment
5. Nếu không thanh toán trong 1 giờ:
   - Cronjob tự động hủy đơn
   - Hoàn lại stock sản phẩm
   - order.status → CANCELLED
   - order.paymentStatus → CANCELLED
```

---

## ⚙️ Cấu Hình

### **1. Cronjob Command**

File: `app/Console/Commands/AutoCancelUnpaidOrders.php`

```php
php artisan orders:auto-cancel-unpaid
```

**Chức năng:**
- Tìm các đơn hàng:
  - `status = PENDING`
  - `paymentStatus = PENDING hoặc FAILED`
  - `createdAt <= 1 giờ trước`
- Hủy đơn và hoàn lại stock

### **2. Scheduler**

File: `routes/console.php`

```php
Schedule::command('orders:auto-cancel-unpaid')
    ->everyTenMinutes()
    ->timezone('Asia/Ho_Chi_Minh');
```

**Chạy mỗi 10 phút** để kiểm tra và hủy đơn.

### **3. Chạy Scheduler**

#### **Development (Local)**

```bash
# Chạy scheduler trong terminal
php artisan schedule:work
```

Hoặc thêm vào crontab:
```bash
* * * * * cd /path/to/shoe-store-php && php artisan schedule:run >> /dev/null 2>&1
```

#### **Production (Server)**

Thêm vào crontab:
```bash
crontab -e

# Thêm dòng này:
* * * * * cd /path/to/shoe-store-php && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🧪 Test

### **Test 1: Chạy Command Thủ Công**

```bash
cd shoe-store-php
php artisan orders:auto-cancel-unpaid
```

**Kết quả:**
```
Đang kiểm tra các đơn hàng chưa thanh toán...
Đã hủy 3 đơn hàng chưa thanh toán.
```

### **Test 2: Tạo Đơn Hàng Test**

```bash
# 1. Tạo đơn hàng với MoMo
# 2. Không thanh toán
# 3. Đợi 1 giờ (hoặc sửa thời gian trong DB)
# 4. Chạy command
php artisan orders:auto-cancel-unpaid

# 5. Kiểm tra order đã bị hủy
```

### **Test 3: Kiểm Tra Retry Payment**

```bash
# 1. Tạo đơn hàng với MoMo
# 2. Hủy thanh toán
# 3. Vào trang order detail
# 4. Thấy nút "Thanh toán lại" và countdown timer
# 5. Click "Thanh toán lại"
# 6. Được redirect đến MoMo lại
```

---

## 📊 Database Changes

### **Order Model - Thêm Methods**

```php
// Kiểm tra có thể retry payment không
$order->canRetryPayment(); // true/false

// Lấy thời gian còn lại (phút)
$order->getRemainingPaymentTimeInMinutes(); // 45
```

### **API Response - Order Detail**

```json
{
  "order": {
    "id": 123,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "canRetryPayment": true,
    "remainingPaymentMinutes": 45,
    ...
  }
}
```

---

## 🎨 Frontend Integration

### **Order Detail Page**

```tsx
// Hiển thị nút retry payment nếu có thể
{order.canRetryPayment && (
  <div>
    <p>Còn {order.remainingPaymentMinutes} phút để thanh toán</p>
    <Button onClick={handleRetryPayment}>
      Thanh toán lại
    </Button>
  </div>
)}

// Hiển thị thông báo nếu hết hạn
{!order.canRetryPayment && order.status === 'PENDING' && (
  <Alert>
    Đơn hàng đã quá thời gian thanh toán. Vui lòng đặt hàng mới.
  </Alert>
)}
```

### **Retry Payment Handler**

```tsx
const handleRetryPayment = async () => {
  try {
    const response = await paymentApi.processPayment({
      orderId: order.id,
      paymentMethod: order.paymentMethod
    });

    if (response.data?.paymentUrl) {
      window.location.href = response.data.paymentUrl;
    }
  } catch (error) {
    toast.error('Không thể tạo link thanh toán');
  }
};
```

---

## 📝 Logs

### **Xem Logs**

```bash
# Xem logs auto-cancel
tail -f storage/logs/laravel.log | grep "Auto-cancel"

# Xem logs chi tiết
grep "Auto-cancelled unpaid order" storage/logs/laravel.log
```

### **Log Format**

```
[2024-12-03 10:30:00] local.INFO: Auto-cancelled unpaid order
{
  "orderId": 123,
  "createdAt": "2024-12-03 09:15:00",
  "amount": 2500000
}
```

---

## 🔧 Troubleshooting

### **Lỗi: Scheduler không chạy**

**Nguyên nhân:** Chưa setup crontab

**Giải pháp:**
```bash
# Development
php artisan schedule:work

# Production
crontab -e
# Thêm: * * * * * cd /path && php artisan schedule:run
```

### **Lỗi: Command không tìm thấy đơn hàng**

**Nguyên nhân:** Không có đơn nào thỏa điều kiện

**Giải pháp:** Kiểm tra:
```sql
SELECT * FROM orders 
WHERE status = 'PENDING' 
  AND paymentStatus IN ('PENDING', 'FAILED')
  AND createdAt <= NOW() - INTERVAL 1 HOUR;
```

### **Lỗi: Stock không được hoàn lại**

**Nguyên nhân:** Lỗi trong transaction

**Giải pháp:** Kiểm tra logs và chạy lại command

---

## 📚 API Endpoints

### **GET /api/orders/{id}**

**Response:**
```json
{
  "code": 200,
  "status": true,
  "data": {
    "order": {
      "id": 123,
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "canRetryPayment": true,
      "remainingPaymentMinutes": 45,
      "createdAt": "2024-12-03 09:15:00"
    }
  }
}
```

### **POST /api/payments**

**Request:**
```json
{
  "orderId": 123,
  "paymentMethod": "E_WALLET"
}
```

**Response:**
```json
{
  "code": 200,
  "status": true,
  "data": {
    "paymentUrl": "https://test-payment.momo.vn/...",
    "transactionCode": "TXN123456",
    "nextStep": "redirect_to_payment"
  }
}
```

**Error (Quá 1 giờ):**
```json
{
  "code": 400,
  "status": false,
  "message": "Đơn hàng đã quá thời gian thanh toán (1 giờ). Vui lòng đặt hàng mới."
}
```

---

## ⚡ Performance

### **Tối Ưu Query**

Command sử dụng index trên:
- `status`
- `paymentStatus`
- `createdAt`

Đảm bảo có index:
```sql
CREATE INDEX idx_orders_auto_cancel 
ON orders(status, paymentStatus, createdAt);
```

### **Batch Processing**

Nếu có nhiều đơn hàng, xử lý theo batch:
```php
Order::where(...)
    ->chunk(100, function ($orders) {
        foreach ($orders as $order) {
            // Process
        }
    });
```

---

## 🎯 Checklist

- [x] ✅ Tạo command `orders:auto-cancel-unpaid`
- [x] ✅ Đăng ký scheduler chạy mỗi 10 phút
- [x] ✅ Thêm method `canRetryPayment()` vào Order model
- [x] ✅ Thêm method `getRemainingPaymentTimeInMinutes()`
- [x] ✅ Cập nhật OrderService trả về thông tin retry
- [x] ✅ Thêm validation 1 giờ trong PaymentService
- [ ] 🔄 Setup crontab trên server
- [ ] 🔄 Frontend: Hiển thị nút "Thanh toán lại"
- [ ] 🔄 Frontend: Hiển thị countdown timer
- [ ] 🔄 Test đầy đủ các trường hợp

---

## 💡 Tips

1. **Thời gian 1 giờ có thể thay đổi:**
   - Sửa trong `Order::canRetryPayment()`
   - Sửa trong `AutoCancelUnpaidOrders`
   - Sửa trong `PaymentService::validateOrderForPayment()`

2. **Tần suất chạy scheduler:**
   - Hiện tại: 10 phút
   - Có thể đổi thành: `->everyFiveMinutes()` hoặc `->everyMinute()`

3. **Notification:**
   - Có thể thêm email thông báo khi đơn bị hủy
   - Có thể thêm SMS reminder trước khi hết hạn

4. **Monitoring:**
   - Log số lượng đơn bị hủy mỗi ngày
   - Alert nếu có quá nhiều đơn bị hủy

---

**Chúc bạn thành công! ⏰**

