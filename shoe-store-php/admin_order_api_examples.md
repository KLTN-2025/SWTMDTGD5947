# Admin Order Management API Documentation v2.0

## 🔐 Authentication
Tất cả API yêu cầu authentication với admin role:
```bash
Authorization: Bearer {admin_token}
Content-Type: application/json
```

## 🚀 Base URL
```
http://localhost:8009/api/admin/orders
```

## 📋 1. GET /api/admin/orders - Danh sách đơn hàng

### Basic Request
```bash
GET /api/admin/orders
```

### With Filters
```bash
GET /api/admin/orders?status=PENDING&payment_status=PENDING&date_from=2025-11-01&date_to=2025-11-30&search=Nguyen&page=1&per_page=15&sort_by=createdAt&sort_order=desc
```

### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by order status | `PENDING`, `CONFIRMED`, `SHIPPED`, `COMPLETED`, `CANCELLED` |
| `payment_status` | string | Filter by payment status | `PENDING`, `PAID`, `UNPAID`, `CANCELLED`, `REFUNDED`, `FAILED` |
| `date_from` | date | From date (YYYY-MM-DD) | `2025-11-01` |
| `date_to` | date | To date (YYYY-MM-DD) | `2025-11-30` |
| `search` | string | Search by order ID, customer name, email, phone | `Nguyen Van A` |
| `page` | integer | Page number (min: 1) | `1` |
| `per_page` | integer | Items per page (min: 1, max: 100) | `15` |
| `sort_by` | string | Sort field | `id`, `amount`, `createdAt`, `status` |
| `sort_order` | string | Sort direction | `asc`, `desc` |

### Response
```json
{
    "code": 200,
    "status": true,
    "msgCode": "SUCCESS",
    "message": "Lấy danh sách đơn hàng thành công",
    "data": {
        "orders": [
            {
                "id": 1,
                "customer": {
                    "id": 5,
                    "name": "Nguyễn Văn A",
                    "email": "user@example.com",
                    "phone": "0123456789"
                },
                "status": "PENDING",
                "statusDisplay": "Chờ xử lý",
                "paymentStatus": "PENDING",
                "paymentStatusDisplay": "Chờ thanh toán",
                "paymentMethod": "CASH",
                "paymentMethodDisplay": "Thanh toán khi nhận hàng",
                "amount": 1500000,
                "deliveryAddress": "123 Đường ABC, Quận 1, TP.HCM",
                "itemsCount": 2,
                "createdAt": "2025-11-13T10:00:00Z",
                "updatedAt": "2025-11-13T10:00:00Z",
                "canCancel": true,
                "canConfirm": true,
                "canShip": false,
                "canComplete": false
            }
        ],
        "pagination": {
            "total": 50,
            "per_page": 10,
            "current_page": 1,
            "last_page": 5,
            "from": 1,
            "to": 10
        }
    }
}
```

## 📄 2. GET /api/admin/orders/{id} - Chi tiết đơn hàng

### Request
```bash
GET /api/admin/orders/1
```

### Response
```json
{
    "code": 200,
    "status": true,
    "msgCode": "SUCCESS",
    "message": "Lấy chi tiết đơn hàng thành công",
    "data": {
        "id": 1,
        "customer": {
            "id": 5,
            "name": "Nguyễn Văn A",
            "email": "user@example.com",
            "phone": "0123456789"
        },
        "status": "PENDING",
        "statusDisplay": "Chờ xử lý",
        "paymentStatus": "PENDING",
        "paymentStatusDisplay": "Chờ thanh toán",
        "paymentMethod": "CASH",
        "paymentMethodDisplay": "Thanh toán khi nhận hàng",
        "amount": 1500000,
        "deliveryAddress": "123 Đường ABC, Quận 1, TP.HCM",
        "items": [
            {
                "id": 1,
                "quantity": 1,
                "itemTotal": 750000,
                "mainImage": "https://example.com/shoe1.jpg",
                "productVariant": {
                    "id": 1,
                    "price": 750000,
                    "product": {
                        "id": 1,
                        "name": "Nike Air Max 270",
                        "skuId": "NIKE001",
                        "basePrice": 750000
                    },
                    "size": {
                        "id": 1,
                        "nameSize": "42"
                    }
                }
            }
        ],
        "createdAt": "2025-11-13T10:00:00Z",
        "updatedAt": "2025-11-13T10:00:00Z",
        "canCancel": true,
        "canConfirm": true,
        "canShip": false,
        "canComplete": false,
        "statusTimeline": [
            {
                "label": "Đặt hàng",
                "completed": true,
                "date": "2025-11-13T10:00:00Z"
            },
            {
                "label": "Xác nhận",
                "completed": false
            },
            {
                "label": "Đang giao",
                "completed": false
            },
            {
                "label": "Hoàn thành",
                "completed": false
            }
        ]
    }
}
```

## ✅ 3. PUT /api/admin/orders/{id}/status - Cập nhật trạng thái

### Request
```bash
PUT /api/admin/orders/1/status
Content-Type: application/json

{
    "status": "CONFIRMED",
    "note": "Đã xác nhận đơn hàng và chuẩn bị hàng"
}
```

### Valid Status Transitions
- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `SHIPPED`
- `SHIPPED` → `COMPLETED`

### Response
```json
{
    "code": 200,
    "status": true,
    "msgCode": "SUCCESS",
    "message": "Cập nhật trạng thái đơn hàng thành công: Đã xác nhận",
    "data": {
        "orderId": 1,
        "oldStatus": "PENDING",
        "newStatus": "CONFIRMED",
        "statusDisplay": "Đã xác nhận"
    }
}
```

### Error Response (Invalid Transition)
```json
{
    "code": 400,
    "status": false,
    "msgCode": "INVALID_STATUS_TRANSITION",
    "message": "Không thể chuyển từ trạng thái COMPLETED sang CONFIRMED"
}
```

## ❌ 4. POST /api/admin/orders/{id}/cancel - Hủy đơn hàng

### Request
```bash
POST /api/admin/orders/1/cancel
Content-Type: application/json

{
    "reason": "Hết hàng",
    "note": "Sản phẩm Nike Air Max 270 size 42 tạm thời hết hàng"
}
```

### Response
```json
{
    "code": 200,
    "status": true,
    "msgCode": "SUCCESS",
    "message": "Hủy đơn hàng thành công",
    "data": {
        "orderId": 1,
        "oldStatus": "PENDING",
        "newStatus": "CANCELLED",
        "reason": "Hết hàng",
        "note": "Sản phẩm Nike Air Max 270 size 42 tạm thời hết hàng"
    }
}
```

### Error Response (Cannot Cancel)
```json
{
    "code": 400,
    "status": false,
    "msgCode": "CANNOT_CANCEL_ORDER",
    "message": "Không thể hủy đơn hàng ở trạng thái hiện tại"
}
```

## 🔍 Filter Parameters

### Status Filter
- `PENDING` - Chờ xử lý
- `CONFIRMED` - Đã xác nhận
- `SHIPPED` - Đang giao hàng
- `COMPLETED` - Hoàn thành
- `CANCELLED` - Đã hủy

### Payment Status Filter
- `PENDING` - Chờ thanh toán
- `UNPAID` - Chưa thanh toán
- `PAID` - Đã thanh toán
- `CANCELLED` - Đã hủy
- `REFUNDED` - Đã hoàn tiền
- `FAILED` - Thanh toán thất bại

### Date Filters
- `date_from` - Từ ngày (YYYY-MM-DD)
- `date_to` - Đến ngày (YYYY-MM-DD)

### Search
- Tìm theo: Order ID, tên khách hàng, email, số điện thoại

### Sorting
- `sort_by`: id, amount, createdAt, status
- `sort_order`: asc, desc

## 🚨 Error Codes

- `400` - VALIDATION_ERROR, INVALID_STATUS_TRANSITION, CANNOT_CANCEL_ORDER
- `404` - ORDER_NOT_FOUND
- `500` - SERVER_ERROR

## 📊 Business Logic

### Order Status Flow
```
PENDING → CONFIRMED → SHIPPED → COMPLETED
    ↓         ↓          ↓
  CANCELLED  CANCELLED  CANCELLED
```

### Permissions
- `canConfirm`: status = PENDING
- `canShip`: status = CONFIRMED  
- `canComplete`: status = SHIPPED
- `canCancel`: status = PENDING hoặc CONFIRMED

### Logging
Mọi thay đổi trạng thái được ghi vào bảng `order_status_logs` với:
- orderId, oldStatus, newStatus
- changedBy (admin ID)
- note (ghi chú)
- createdAt (thời gian thay đổi)

## 🧪 Testing Examples

### 1. Test với cURL
```bash
# Get admin token first (replace with actual admin credentials)
TOKEN=$(curl -X POST "http://localhost:8009/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.data.token')

# Test get orders list
curl -X GET "http://localhost:8009/api/admin/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Test get order detail
curl -X GET "http://localhost:8009/api/admin/orders/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Test update status
curl -X PUT "http://localhost:8009/api/admin/orders/1/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CONFIRMED","note":"Đã xác nhận đơn hàng"}'

# Test cancel order
curl -X POST "http://localhost:8009/api/admin/orders/1/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Hết hàng","note":"Sản phẩm tạm hết"}'
```

### 2. Test với Postman
1. **Import Collection**: Tạo collection mới với base URL `http://localhost:8009/api/admin`
2. **Set Authorization**: Bearer Token với admin token
3. **Test Scenarios**:
   - ✅ Get orders without filters
   - ✅ Get orders with all filters
   - ✅ Get order detail with valid ID
   - ✅ Get order detail with invalid ID (404)
   - ✅ Update status with valid transition
   - ✅ Update status with invalid transition (400)
   - ✅ Cancel order with valid status
   - ✅ Cancel order with invalid status (400)

### 3. Common Test Cases
```javascript
// Postman Pre-request Script để set token
pm.environment.set("admin_token", "your_admin_token_here");

// Postman Tests để validate response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('code');
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData).to.have.property('msgCode');
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('data');
});
```

## 🔧 Implementation Checklist

### Backend Setup
- [x] ✅ AdminOrderController created
- [x] ✅ Routes registered in api.php
- [x] ✅ OrderStatusLog model created
- [x] ✅ Migration run successfully
- [ ] ⚠️ Admin middleware added to routes
- [ ] ⚠️ Database indexes created

### Required Database Indexes
```sql
-- Thêm indexes để tối ưu performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(createdAt);
CREATE INDEX idx_orders_user_id ON orders(userId);
CREATE INDEX idx_orders_payment_status ON orders(paymentStatus);
```

### Security Checklist
- [ ] ⚠️ Admin middleware protection
- [ ] ⚠️ Rate limiting for admin APIs
- [ ] ⚠️ Input sanitization
- [ ] ⚠️ SQL injection prevention (using Eloquent ORM ✅)
- [ ] ⚠️ XSS prevention (JSON response ✅)

## 🚨 Troubleshooting

### Common Errors

#### 401 Unauthorized
```json
{"code":401,"status":false,"msgCode":"UNAUTHORIZED","message":"Bạn chưa đăng nhập"}
```
**Solution**: Đảm bảo token hợp lệ và user có role admin

#### 404 Order Not Found
```json
{"code":404,"status":false,"msgCode":"ORDER_NOT_FOUND","message":"Không tìm thấy đơn hàng"}
```
**Solution**: Kiểm tra order ID có tồn tại trong database

#### 400 Invalid Status Transition
```json
{"code":400,"status":false,"msgCode":"INVALID_STATUS_TRANSITION","message":"Không thể chuyển từ trạng thái COMPLETED sang PENDING"}
```
**Solution**: Tuân thủ status flow: PENDING → CONFIRMED → SHIPPED → COMPLETED

#### 500 Server Error
```json
{"code":500,"status":false,"msgCode":"SERVER_ERROR","message":"Lỗi server"}
```
**Solution**: Kiểm tra logs, database connection, relationships

## 📞 Support

- **Documentation**: Xem file này
- **API Testing**: Sử dụng Postman collection
- **Database**: Kiểm tra migrations và relationships
- **Logs**: Xem Laravel logs tại `storage/logs/laravel.log`

---

**Version**: 2.0  
**Last Updated**: 2025-11-13  
**Status**: ✅ Ready for Production (với một số cải tiến cần thiết)
