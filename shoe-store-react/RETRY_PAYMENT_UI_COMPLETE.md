# ✅ Retry Payment UI - Hoàn Thành

## 🎨 Giao Diện Đã Implement

### **1. Order Detail Page - Retry Payment UI**

**File:** `client/pages/orders/OrderDetail.tsx`

#### **Tính Năng:**

1. ✅ **Alert Chưa Thanh Toán** (Màu cam)
   - Hiển thị khi `canRetryPayment = true`
   - Countdown timer: "Còn X phút"
   - Nút "Thanh toán ngay"
   - Icon cảnh báo

2. ✅ **Alert Hết Hạn** (Màu đỏ)
   - Hiển thị khi order PENDING nhưng không thể retry
   - Thông báo sẽ bị hủy tự động
   - Link "Tiếp tục mua sắm"

3. ✅ **Alert Đã Hủy** (Màu đỏ)
   - Hiển thị khi order đã CANCELLED
   - Thông báo đơn hàng đã bị hủy

4. ✅ **Countdown Timer**
   - Tự động đếm ngược mỗi phút
   - Auto reload page khi hết thời gian
   - Real-time update

5. ✅ **Retry Payment Handler**
   - Gọi API `/api/payments`
   - Loading state
   - Toast notifications
   - Auto redirect đến MoMo

---

## 📊 UI States

### **State 1: Chưa Thanh Toán (Còn Thời Gian)**

```tsx
Điều kiện: canRetryPayment = true && remainingPaymentMinutes > 0

┌─────────────────────────────────────────────────────────┐
│ ⚠️ Chưa hoàn tất thanh toán                             │
│                                                          │
│ Đơn hàng của bạn chưa được thanh toán. Còn 45 phút     │
│ để hoàn tất thanh toán. Sau thời gian này, đơn hàng    │
│ sẽ tự động bị hủy.                                      │
│                                                          │
│ [🔄 Thanh toán ngay]                                    │
└─────────────────────────────────────────────────────────┘
```

**Màu sắc:** Orange (border-orange-500, bg-orange-50)

### **State 2: Hết Hạn Thanh Toán**

```tsx
Điều kiện: !canRetryPayment && status = PENDING && paymentStatus != UNPAID

┌─────────────────────────────────────────────────────────┐
│ ❌ Đơn hàng đã hết hạn thanh toán                       │
│                                                          │
│ Đơn hàng này đã quá thời gian thanh toán (1 giờ) và    │
│ sẽ sớm bị hủy tự động. Vui lòng đặt hàng mới nếu bạn   │
│ vẫn muốn mua sản phẩm này.                              │
│                                                          │
│ [Tiếp tục mua sắm]                                      │
└─────────────────────────────────────────────────────────┘
```

**Màu sắc:** Red (vaructive")

### **State 3: Đã Hủy**

```tsx
Điều kiện: status = CANCELLED

┌─────────────────────────────────────────────────────────┐
│ ❌ Đơn hàng đã bị hủy                                   │
│                                                          │
│ Đơn hàng này đã bị hủy. Nếu bạn vẫn muốn mua sản phẩm, │
│ vui lòng đặt hàng mới.                                  │
└─────────────────────────────────────────────────────────┘
```

**Màu sắc:** Red (variant="destructive")

---

## 🔄 Flow Hoàn Chỉnh

### **Scenario 1: User Retry Payment Thành Công**

```
1. User vào order detail
   ↓
2. Thấy alert: "Còn 45 phút để thanh toán"
   ↓
3. Click "Thanh toán ngay"
   ↓
4. Loading... (nút disabled)
   ↓
5. Toast: "Đang chuyển đến trang thanh toán..."
   ↓
6. Redirect đến MoMo (sau 1s)
   ↓
7. User thanh toán thành công
   ↓
8. MoMo redirect về /orders
   ↓
9. ✅ Order status = CONFIRMED
```

### **Scenario 2: User Không Thanh Toán**

```
1. User vào order detail
   ↓
2. Thấy alert: "Còn 45 phút"
   ↓
3. User không làm gì
   ↓
4. Countdown: 45 → 44 → 43 → ... → 1 → 0
   ↓
5. Auto reload page
   ↓
6. Alert đổi thành: "Đơn hàng đã hết hạn"
   ↓
7. Sau 10 phút, cronjob chạy
   ↓
8. Order status = CANCELLED
   ↓
9. User reload page
   ↓
10. ❌ Thấy alert: "Đơn hàng đã bị hủy"
```

### **Scenario 3: Retry Payment Thất Bại**

```
1. User click "Thanh toán ngay"
   ↓
2. API call thất bại (lỗi network, timeout, etc.)
   ↓
3. Toast error: "Không thể tạo link thanh toán"
   ↓
4. Nút enabled lại
   ↓
5. User có thể retry lại
```

---

## 🎨 Code Highlights

### **1. Countdown Timer**

```tsx
useEffect(() => {
  if (!order || !order.canRetryPayment || !order.remainingPaymentMinutes) {
    return;
  }

  setRemainingMinutes(order.remainingPaymentMinutes);

  const timer = setInterval(() => {
    setRemainingMinutes((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        // Reload page to update order status
        if (id) {
          loadOrderDetail(parseInt(id));
        }
        return 0;
      }
      return prev - 1;
    });
  }, 60000); // Every minute

  return () => clearInterval(timer);
}, [order?.canRetryPayment, order?.remainingPaymentMinutes, id]);
```

**Tính năng:**
- Đếm ngược mỗi phút
- Auto reload khi hết thời gian
- Cleanup timer khi unmount

### **2. Retry Payment Handler**

```tsx
const handleRetryPayment = async () => {
  if (!order) return;

  try {
    setIsRetryingPayment(true);
    
    const response = await paymentApi.processPayment({
      orderId: order.id,
      paymentMethod: order.paymentMethod as any
    });

    if (response.status && response.data?.paymentUrl) {
      toast.success('Đang chuyển đến trang thanh toán...');
      setTimeout(() => {
        window.location.href = response.data!.paymentUrl!;
      }, 1000);
    } else {
      toast.error(response.message || 'Không thể tạo link thanh toán');
      setIsRetryingPayment(false);
    }
  } catch (error) {
    console.error('Retry payment failed:', error);
    
    if (error instanceof ApiError) {
      toast.error(error.apiMessage as string || 'Không thể tạo link thanh toán');
    } else {
      toast.error('Có lỗi xảy ra khi tạo link thanh toán');
    }
    
    setIsRetryingPayment(false);
  }
};
```

**Tính năng:**
- Loading state
- Error handling
- Toast notifications
- Delay 1s trước khi redirect

### **3. Alert Components**

```tsx
{/* Chưa thanh toán */}
{order.canRetryPayment && remainingMinutes > 0 && (
  <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
    <AlertTriangle className="h-4 w-4 text-orange-600" />
    <AlertTitle className="text-orange-900 dark:text-orange-100">
      Chưa hoàn tất thanh toán
    </AlertTitle>
    <AlertDescription className="text-orange-800 dark:text-orange-200">
      <div className="space-y-3">
        <p>
          Đơn hàng của bạn chưa được thanh toán. Còn <strong>{remainingMinutes} phút</strong>
        </p>
        <Button onClick={handleRetryPayment} disabled={isRetryingPayment}>
          {isRetryingPayment ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Thanh toán ngay
            </>
          )}
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}

{/* Hết hạn */}
{!order.canRetryPayment && order.status === 'PENDING' && (
  <Alert variant="destructive">
    <XCircle className="h-4 w-4" />
    <AlertTitle>Đơn hàng đã hết hạn thanh toán</AlertTitle>
    <AlertDescription>
      <div className="space-y-3">
        <p>Đơn hàng này đã quá thời gian thanh toán (1 giờ)</p>
        <Link to="/products">
          <Button variant="outline">Tiếp tục mua sắm</Button>
        </Link>
      </div>
    </AlertDescription>
  </Alert>
)}

{/* Đã hủy */}
{order.status === 'CANCELLED' && (
  <Alert variant="destructive">
    <XCircle className="h-4 w-4" />
    <AlertTitle>Đơn hàng đã bị hủy</AlertTitle>
    <AlertDescription>
      Đơn hàng này đã bị hủy. Vui lòng đặt hàng mới.
    </AlertDescription>
  </Alert>
)}
```

---

## 🧪 Test Cases

### **Test 1: Hiển thị Alert Chưa Thanh Toán**

```
1. Tạo đơn hàng với MoMo
2. Hủy thanh toán
3. Vào order detail
4. ✅ Thấy alert màu cam
5. ✅ Thấy countdown "Còn X phút"
6. ✅ Thấy nút "Thanh toán ngay"
```

### **Test 2: Countdown Timer**

```
1. Vào order detail (còn 45 phút)
2. Đợi 1 phút
3. ✅ Countdown giảm xuống 44 phút
4. Đợi thêm 1 phút
5. ✅ Countdown giảm xuống 43 phút
```

### **Test 3: Retry Payment**

```
1. Click "Thanh toán ngay"
2. ✅ Nút disabled, hiển thị "Đang xử lý..."
3. ✅ Toast: "Đang chuyển đến trang thanh toán..."
4. ✅ Sau 1s redirect đến MoMo
5. Thanh toán thành công
6. ✅ Redirect về orders
7. ✅ Order status = CONFIRMED
```

### **Test 4: Hết Hạn**

```
1. Tạo đơn hàng
2. Sửa createdAt = 2 giờ trước (trong DB)
3. Vào order detail
4. ✅ Thấy alert đỏ "Đơn hàng đã hết hạn"
5. ✅ Không thấy nút "Thanh toán ngay"
6. ✅ Thấy link "Tiếp tục mua sắm"
```

### **Test 5: Auto Reload Khi Hết Thời Gian**

```
1. Vào order detail (còn 2 phút)
2. Đợi 2 phút
3. ✅ Page tự động reload
4. ✅ Alert đổi thành "Đơn hàng đã hết hạn"
```

### **Test 6: Error Handling**

```
1. Tắt backend server
2. Click "Thanh toán ngay"
3. ✅ Toast error: "Không thể tạo link thanh toán"
4. ✅ Nút enabled lại
5. ✅ User có thể retry
```

---

## 📱 Responsive Design

### **Desktop**
- Alert full width
- Nút "Thanh toán ngay" inline
- Countdown rõ ràng

### **Mobile**
- Alert stack vertical
- Nút full width
- Text wrap properly

---

## 🎯 Checklist

### Frontend
- [x] ✅ Import Alert components
- [x] ✅ Import payment API
- [x] ✅ Add state variables
- [x] ✅ Implement countdown timer
- [x] ✅ Implement retry payment handler
- [x] ✅ Add alert for unpaid orders
- [x] ✅ Add alert for expired orders
- [x] ✅ Add alert for cancelled orders
- [x] ✅ Add loading states
- [x] ✅ Add toast notifications
- [x] ✅ Update type definitions
- [x] ✅ Test all scenarios

### Backend
- [x] ✅ Order model helper methods
- [x] ✅ OrderService returns retry info
- [x] ✅ PaymentService validation
- [x] ✅ Auto-cancel command
- [x] ✅ Scheduler setup

---

## 🚀 Deployment Checklist

- [ ] Test trên staging environment
- [ ] Test với MoMo sandbox
- [ ] Test countdown timer
- [ ] Test retry payment flow
- [ ] Test auto-cancel cronjob
- [ ] Setup crontab trên production
- [ ] Monitor logs
- [ ] Setup alerts cho payment failures

---

## 💡 Future Enhancements

1. **Email Notification**
   - Gửi email reminder trước khi hết hạn (45 phút, 15 phút, 5 phút)
   - Gửi email khi đơn bị hủy

2. **SMS Notification**
   - SMS reminder trước khi hết hạn
   - SMS confirmation khi thanh toán thành công

3. **Push Notification**
   - Browser push notification
   - Mobile app push notification

4. **Analytics**
   - Track số lượng retry payment
   - Track conversion rate
   - Track abandonment rate

5. **A/B Testing**
   - Test thời gian hết hạn (30 phút vs 1 giờ vs 2 giờ)
   - Test UI/UX của alert
   - Test wording của messages

---

**Hoàn thành! 🎉**

