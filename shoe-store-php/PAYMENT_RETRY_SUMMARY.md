# ✅ Tóm Tắt: Retry Payment & Auto-Cancel

## 🎯 Đã Hoàn Thành

### **1. Trả Lời Câu Hỏi**

#### **Q1: Thanh toán MoMo thành công thì order có chuyển sang CONFIRMED không?**

✅ **Có!** Khi MoMo webhook gọi về với `resultCode = 0`:
- `payment.status`: `PENDING` → `PAID`
- `order.status`: `PENDING` → `CONFIRMED`  
- `order.paymentStatus`: `PENDING` → `PAID`

Code trong `PaymentService::performPaymentConfirmation()`:
```php
case 'PAID':
    $order->paymentStatus = Order::PAYMENT_STATUS_PAID;
    $order->status = Order::STATUS_CONFIRMED;
```

#### **Q2: Làm sao retry payment trong 1 giờ và auto-cancel sau đó?**

✅ **Đã implement đầy đủ!**

---

## 🔧 Những Gì Đã Làm

### **1. Validation Thời Gian 1 Giờ**

**File:** `app/services/PaymentService.php`

```php
private function validateOrderForPayment($order) 
{
    // Kiểm tra thời gian: chỉ cho phép thanh toán trong vòng 1 giờ
    $createdAt = \Carbon\Carbon::parse($order->createdAt);
    $now = \Carbon\Carbon::now();
    $hoursSinceCreated = $createdAt->diffInHours($now);

    if ($hoursSinceCreated >= 1) {
        return [
            'isValid' => false,
            'response' => [
                'code' => HttpCode::BAD_REQUEST,
                'status' => false,
                'message' => 'Đơn hàng đã quá thời gian thanh toán (1 giờ)'
            ]
        ];
    }
}
```

**Kết quả:** User không thể retry payment sau 1 giờ.

---

### **2. Helper Methods trong Order Model**

**File:** `app/Models/Order.php`

```php
// Kiểm tra có thể retry payment không
public function canRetryPayment(): bool
{
    // Phải PENDING và chưa quá 1 giờ
    if ($this->status !== self::STATUS_PENDING) return false;
    if (!in_array($this->paymentStatus, [
        self::PAYMENT_STATUS_PENDING, 
        self::PAYMENT_STATUS_FAILED
    ])) return false;
    
    $hoursSinceCreated = Carbon::parse($this->createdAt)
        ->diffInHours(Carbon::now());
    
    return $hoursSinceCreated < 1;
}

// Lấy thời gian còn lại (phút)
public function getRemainingPaymentTimeInMinutes(): int
{
    $expiresAt = Carbon::parse($this->createdAt)->addHour();
    $now = Carbon::now();
    
    if ($now->gte($expiresAt)) return 0;
    
    return $now->diffInMinutes($expiresAt);
}
```

**Kết quả:** Có thể check dễ dàng từ frontend.

---

### **3. Cập Nhật OrderService**

**File:** `app/services/OrderService.php`

```php
public function getOrderDetail($user, $orderId) 
{
    // ...
    
    // Thêm thông tin retry payment
    $order->canRetryPayment = $order->canRetryPayment();
    $order->remainingPaymentMinutes = $order->canRetryPayment() 
        ? $order->getRemainingPaymentTimeInMinutes() 
        : 0;
    
    return [
        'data' => ['order' => $order]
    ];
}
```

**Response mẫu:**
```json
{
  "order": {
    "id": 123,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "canRetryPayment": true,
    "remainingPaymentMinutes": 45
  }
}
```

---

### **4. Auto-Cancel Command**

**File:** `app/Console/Commands/AutoCancelUnpaidOrders.php`

```php
php artisan orders:auto-cancel-unpaid
```

**Chức năng:**
- Tìm orders: `status = PENDING`, `paymentStatus = PENDING/FAILED`, `createdAt <= 1h ago`
- Hủy đơn: `status → CANCELLED`, `paymentStatus → CANCELLED`
- Hoàn lại stock sản phẩm
- Log chi tiết

**Test:**
```bash
php artisan orders:auto-cancel-unpaid
# Output: Đã hủy 1 đơn hàng chưa thanh toán.
```

---

### **5. Scheduler Setup**

**File:** `routes/console.php`

```php
Schedule::command('orders:auto-cancel-unpaid')
    ->everyTenMinutes()
    ->timezone('Asia/Ho_Chi_Minh')
    ->description('Tự động hủy các đơn hàng chưa thanh toán sau 1 giờ');
```

**Chạy scheduler:**
```bash
# Development
php artisan schedule:work

# Production (thêm vào crontab)
* * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🎨 Frontend Integration (Cần Làm)

### **1. Order Detail Page**

```tsx
// Hiển thị countdown và nút retry
{order.canRetryPayment && (
  <Alert>
    <Clock className="h-4 w-4" />
    <AlertTitle>Chưa hoàn tất thanh toán</AlertTitle>
    <AlertDescription>
      Còn {order.remainingPaymentMinutes} phút để thanh toán.
      Sau đó đơn hàng sẽ tự động hủy.
    </AlertDescription>
    <Button onClick={handleRetryPayment} className="mt-2">
      Thanh toán lại
    </Button>
  </Alert>
)}

{!order.canRetryPayment && order.status === 'PENDING' && (
  <Alert variant="destructive">
    <AlertTitle>Đơn hàng đã hết hạn</AlertTitle>
    <AlertDescription>
      Đơn hàng đã quá thời gian thanh toán. Vui lòng đặt hàng mới.
    </AlertDescription>
  </Alert>
)}
```

### **2. Retry Payment Handler**

```tsx
const handleRetryPayment = async () => {
  try {
    setIsLoading(true);
    
    const response = await paymentApi.processPayment({
      orderId: order.id,
      paymentMethod: order.paymentMethod
    });

    if (response.status && response.data?.paymentUrl) {
      toast.success('Đang chuyển đến trang thanh toán...');
      setTimeout(() => {
        window.location.href = response.data.paymentUrl;
      }, 1000);
    } else {
      toast.error(response.message || 'Không thể tạo link thanh toán');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.apiMessage);
    } else {
      toast.error('Có lỗi xảy ra');
    }
  } finally {
    setIsLoading(false);
  }
};
```

### **3. Countdown Timer (Optional)**

```tsx
const [timeLeft, setTimeLeft] = useState(order.remainingPaymentMinutes);

useEffect(() => {
  if (!order.canRetryPayment) return;
  
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(timer);
        // Reload page để cập nhật trạng thái
        window.location.reload();
        return 0;
      }
      return prev - 1;
    });
  }, 60000); // Mỗi phút

  return () => clearInterval(timer);
}, [order.canRetryPayment]);

// Hiển thị
<p>Còn {timeLeft} phút</p>
```

---

## 📊 Flow Hoàn Chỉnh

### **Scenario 1: Thanh Toán Thành Công**

```
1. User checkout → Order created (PENDING)
2. Redirect to MoMo
3. User thanh toán thành công
4. MoMo webhook → Backend cập nhật (CONFIRMED, PAID)
5. User redirect về orders
6. ✅ Hoàn tất
```

### **Scenario 2: Thanh Toán Thất Bại → Retry**

```
1. User checkout → Order created (PENDING)
2. Redirect to MoMo
3. User gặp lỗi/hủy
4. User quay về order detail
5. Thấy: "Còn 45 phút để thanh toán"
6. Click "Thanh toán lại"
7. Redirect to MoMo lại
8. Thanh toán thành công
9. ✅ Hoàn tất
```

### **Scenario 3: Không Thanh Toán → Auto-Cancel**

```
1. User checkout → Order created (PENDING)
2. Redirect to MoMo
3. User hủy/không thanh toán
4. Sau 1 giờ:
   - Cronjob chạy (mỗi 10 phút)
   - Tìm thấy order quá hạn
   - Hủy order (CANCELLED)
   - Hoàn lại stock
5. User vào order detail thấy: "Đơn hàng đã hết hạn"
6. ❌ Cần đặt hàng mới
```

---

## 🧪 Test Cases

### **Test 1: Retry Payment Trong 1 Giờ**

```bash
1. Tạo đơn hàng với MoMo
2. Hủy thanh toán
3. Vào order detail
4. Kiểm tra: canRetryPayment = true
5. Kiểm tra: remainingPaymentMinutes > 0
6. Click "Thanh toán lại"
7. Được redirect đến MoMo
8. ✅ Pass
```

### **Test 2: Không Thể Retry Sau 1 Giờ**

```bash
1. Tạo đơn hàng
2. Đợi 1 giờ (hoặc sửa createdAt trong DB)
3. Vào order detail
4. Kiểm tra: canRetryPayment = false
5. Kiểm tra: Hiển thị "Đơn hàng đã hết hạn"
6. Try gọi API retry payment
7. Nhận lỗi: "Đơn hàng đã quá thời gian thanh toán"
8. ✅ Pass
```

### **Test 3: Auto-Cancel Command**

```bash
1. Tạo 3 đơn hàng chưa thanh toán
2. Sửa createdAt = 2 giờ trước
3. Chạy: php artisan orders:auto-cancel-unpaid
4. Kiểm tra: 3 đơn đã bị hủy
5. Kiểm tra: Stock đã được hoàn lại
6. ✅ Pass
```

### **Test 4: Scheduler**

```bash
1. Chạy: php artisan schedule:work
2. Tạo đơn hàng chưa thanh toán
3. Sửa createdAt = 2 giờ trước
4. Đợi 10 phút (hoặc đến lúc scheduler chạy)
5. Kiểm tra logs: "Auto-cancelled unpaid order"
6. Kiểm tra: Đơn đã bị hủy
7. ✅ Pass
```

---

## 📝 Checklist

### Backend
- [x] ✅ Validation 1 giờ trong PaymentService
- [x] ✅ Helper methods trong Order model
- [x] ✅ Cập nhật OrderService trả về retry info
- [x] ✅ Tạo AutoCancelUnpaidOrders command
- [x] ✅ Đăng ký scheduler
- [x] ✅ Test command thủ công
- [ ] 🔄 Setup crontab trên server production

### Frontend
- [ ] 🔄 Hiển thị nút "Thanh toán lại"
- [ ] 🔄 Hiển thị countdown timer
- [ ] 🔄 Hiển thị alert khi hết hạn
- [ ] 🔄 Implement retry payment handler
- [ ] 🔄 Test UI/UX flow

### Documentation
- [x] ✅ AUTO_CANCEL_UNPAID_ORDERS.md
- [x] ✅ PAYMENT_RETRY_SUMMARY.md

---

## 🎯 Kết Luận

### **Đã Giải Quyết Đầy Đủ:**

1. ✅ **Thanh toán thành công → Order CONFIRMED**: Có, tự động qua webhook
2. ✅ **Retry payment trong 1 giờ**: Có, qua API validation và helper methods
3. ✅ **Auto-cancel sau 1 giờ**: Có, qua cronjob command
4. ✅ **Hoàn lại stock**: Có, tự động khi cancel

### **Cần Làm Tiếp:**

1. Frontend: Implement UI cho retry payment
2. Frontend: Hiển thị countdown timer
3. Production: Setup crontab
4. Optional: Email notification khi đơn bị hủy
5. Optional: SMS reminder trước khi hết hạn

---

**Hệ thống đã sẵn sàng! 🚀**
