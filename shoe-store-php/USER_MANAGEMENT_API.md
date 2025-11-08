# API Quản Lý Người Dùng (User Management API)

## Tổng Quan
API quản lý người dùng cung cấp đầy đủ các chức năng CRUD (Create, Read, Update, Delete) cho hệ thống quản lý người dùng. API này được bảo vệ bởi middleware admin và tuân theo cùng kiến trúc với các module khác trong hệ thống.

**Lưu ý quan trọng**: Hệ thống sử dụng kiến trúc multi-provider authentication:
- Bảng `users`: Lưu thông tin cơ bản (name, userName, email, roleId, isActive)
- Bảng `auth_providers`: Lưu thông tin xác thực (password, provider type)
- Bảng `user_profile`: Lưu thông tin bổ sung (phone, address, dateOfBirth)

## Base URL
```
/api/admin/users
```

## Kiến Trúc
- **Controller**: `UserController` - Xử lý HTTP requests
- **Service**: `UserService` - Chứa business logic
- **Model**: `User`, `UserProfile` - Eloquent models
- **Middleware**: Admin middleware (cần xác thực và quyền admin)

---

## 1. Lấy Danh Sách Người Dùng

### Endpoint
```
GET /api/admin/users
```

### Query Parameters
| Tham số | Kiểu | Mô tả | Mặc định |
|---------|------|-------|----------|
| per_page | integer | Số lượng người dùng trên mỗi trang | 15 |

### Response Success (200)
```json
{
  "code": 200,
  "status": true,
  "msgCode": "SUCCESS",
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Nguyễn Văn A",
        "userName": "nguyenvana",
        "email": "nguyenvana@example.com",
        "imageUrl": "users/1234567890_abc123.jpg",
        "isActive": true,
        "roleId": 1,
        "hasPassword": true,
        "provider": "LOCAL",
        "createdAt": "2024-01-01T00:00:00.000000Z",
        "updatedAt": "2024-01-01T00:00:00.000000Z",
        "role": {
          "id": 1,
          "name": "ADMIN"
        },
        "profile": {
          "id": 1,
          "userId": 1,
          "phone": "0123456789",
          "address": "123 Đường ABC, TP.HCM",
          "dateOfBirth": "1990-01-01"
        }
      }
    ],
    "pagination": {
      "total": 100,
      "per_page": 15,
      "current_page": 1,
      "last_page": 7,
      "from": 1,
      "to": 15
    }
  }
}
```

---

## 2. Tìm Kiếm Người Dùng

### Endpoint
```
GET /api/admin/users/search
```

### Query Parameters
| Tham số | Kiểu | Mô tả | Bắt buộc |
|---------|------|-------|----------|
| keyword | string | Tìm kiếm theo tên, userName, email | Không |
| role_id | integer | Lọc theo vai trò | Không |
| is_active | boolean | Lọc theo trạng thái hoạt động | Không |
| sort_by | string | Sắp xếp theo (name, email, createdAt) | Không |
| sort_order | string | Thứ tự sắp xếp (asc, desc) | Không |
| per_page | integer | Số lượng trên mỗi trang (1-100) | Không |

### Example Request
```
GET /api/admin/users/search?keyword=nguyen&role_id=2&is_active=true&sort_by=createdAt&sort_order=desc&per_page=20
```

### Response Success (200)
```json
{
  "code": 200,
  "status": true,
  "msgCode": "SUCCESS",
  "message": "Tìm kiếm người dùng thành công",
  "data": {
    "users": [...],
    "pagination": {...}
  }
}
```

---

## 3. Xem Chi Tiết Người Dùng

### Endpoint
```
GET /api/admin/users/{id}
```

### URL Parameters
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| id | integer | ID của người dùng |

### Response Success (200)
```json
{
  "code": 200,
  "status": true,
  "msgCode": "SUCCESS",
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "userName": "nguyenvana",
    "email": "nguyenvana@example.com",
    "imageUrl": "users/1234567890_abc123.jpg",
    "isActive": true,
    "roleId": 1,
    "createdAt": "2024-01-01T00:00:00.000000Z",
    "updatedAt": "2024-01-01T00:00:00.000000Z",
    "role": {
      "id": 1,
      "name": "ADMIN"
    },
    "profile": {
      "id": 1,
      "userId": 1,
      "phone": "0123456789",
      "address": "123 Đường ABC, TP.HCM",
      "dateOfBirth": "1990-01-01"
    }
  }
}
```

### Response Error (404)
```json
{
  "code": 404,
  "status": false,
  "msgCode": "NOT_FOUND",
  "message": "Người dùng không tồn tại"
}
```

---

## 4. Thêm Người Dùng Mới

### Endpoint
```
POST /api/admin/users
```

### Content-Type
```
multipart/form-data
```

### Request Body
| Trường | Kiểu | Mô tả | Bắt buộc |
|--------|------|-------|----------|
| name | string (max: 50) | Tên người dùng | Có |
| userName | string (max: 50) | Tên đăng nhập (unique) | Có |
| email | string (max: 50) | Email (unique) | Có |
| password | string (min: 6) | Mật khẩu (lưu trong auth_providers) | Không |
| roleId | integer | ID vai trò (phải tồn tại) | Có |
| isActive | boolean | Trạng thái hoạt động | Không |
| image | file | Ảnh đại diện (jpeg, png, jpg, gif, webp, max: 2MB) | Không |
| phone | string (max: 20) | Số điện thoại | Không |
| address | string (max: 255) | Địa chỉ | Không |
| dateOfBirth | date | Ngày sinh (YYYY-MM-DD) | Không |

### Example Request (FormData)
```javascript
const formData = new FormData();
formData.append('name', 'Nguyễn Văn A');
formData.append('userName', 'nguyenvana');
formData.append('email', 'nguyenvana@example.com');
formData.append('password', 'password123');
formData.append('roleId', '2');
formData.append('isActive', 'true');
formData.append('image', imageFile);
formData.append('phone', '0123456789');
formData.append('address', '123 Đường ABC, TP.HCM');
formData.append('dateOfBirth', '1990-01-01');
```

### Response Success (200)
```json
{
  "code": 200,
  "status": true,
  "msgCode": "SUCCESS",
  "message": "Tạo người dùng thành công",
  "data": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "userName": "nguyenvana",
    "email": "nguyenvana@example.com",
    "imageUrl": "users/1234567890_abc123.jpg",
    "isActive": true,
    "roleId": 2,
    "createdAt": "2024-01-01T00:00:00.000000Z",
    "updatedAt": "2024-01-01T00:00:00.000000Z",
    "role": {...},
    "profile": {...}
  }
}
```

### Response Error (422)
```json
{
  "code": 422,
  "status": false,
  "msgCode": "VALIDATION_ERROR",
  "message": {
    "email": ["Email đã tồn tại"],
    "userName": ["Tên đăng nhập đã tồn tại"]
  }
}
```

---

## 5. Cập Nhật Người Dùng

### Endpoint
```
PUT /api/admin/users/{id}
POST /api/admin/users/{id}  (Alternative for form-data)
```

### Content-Type
```
multipart/form-data
```

### URL Parameters
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| id | integer | ID của người dùng cần cập nhật |

### Request Body
| Trường | Kiểu | Mô tả | Bắt buộc |
|--------|------|-------|----------|
| name | string (max: 50) | Tên người dùng | Có |
| userName | string (max: 50) | Tên đăng nhập (unique) | Có |
| email | string (max: 50) | Email (unique) | Có |
| password | string (min: 6) | Mật khẩu mới (cập nhật trong auth_providers, để trống nếu không đổi) | Không |
| roleId | integer | ID vai trò | Có |
| isActive | boolean | Trạng thái hoạt động | Không |
| image | file | Ảnh đại diện mới | Không |
| phone | string (max: 20) | Số điện thoại | Không |
| address | string (max: 255) | Địa chỉ | Không |
| dateOfBirth | date | Ngày sinh | Không |

### Example Request (FormData)
```javascript
const formData = new FormData();
formData.append('name', 'Nguyễn Văn A Updated');
formData.append('userName', 'nguyenvana');
formData.append('email', 'nguyenvana@example.com');
formData.append('roleId', '2');
formData.append('isActive', 'false');
formData.append('image', newImageFile); // Optional
formData.append('phone', '0987654321');
// password không gửi nếu không muốn đổi
```

### Response Success (200)
```json
{
  "code": 200,
  "status": true,
  "msgCode": "SUCCESS",
  "message": "Cập nhật người dùng thành công",
  "data": {
    "id": 1,
    "name": "Nguyễn Văn A Updated",
    "userName": "nguyenvana",
    "email": "nguyenvana@example.com",
    "imageUrl": "users/1234567890_xyz789.jpg",
    "isActive": false,
    "roleId": 2,
    "createdAt": "2024-01-01T00:00:00.000000Z",
    "updatedAt": "2024-01-02T00:00:00.000000Z",
    "role": {...},
    "profile": {...}
  }
}
```

**Lưu ý**: 
- Nếu upload ảnh mới, ảnh cũ sẽ tự động bị xóa
- Mật khẩu chỉ được cập nhật trong bảng `auth_providers` khi trường `password` được gửi lên
- Nếu user chưa có auth provider LOCAL, hệ thống sẽ tự động tạo mới
- Email và userName phải unique, trừ khi trùng với chính người dùng đang cập nhật

---

## 6. Xóa Người Dùng

### Endpoint
```
DELETE /api/admin/users/{id}
```

### URL Parameters
| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| id | integer | ID của người dùng cần xóa |

### Response Success (200)
```json
{
  "code": 200,
  "status": true,
  "msgCode": "SUCCESS",
  "message": "Xóa người dùng thành công"
}
```

### Response Error (404)
```json
{
  "code": 404,
  "status": false,
  "msgCode": "NOT_FOUND",
  "message": "Người dùng không tồn tại"
}
```

**Lưu ý**: 
- Sử dụng Soft Delete (người dùng không bị xóa vĩnh viễn)
- Ảnh đại diện của người dùng sẽ bị xóa khỏi server
- Các bản ghi liên quan (profile, auth_providers, orders, etc.) sẽ được xử lý theo cascade rules

---

## Mã Lỗi (Error Codes)

| Code | MsgCode | Mô tả |
|------|---------|-------|
| 200 | SUCCESS | Thành công |
| 400 | BAD_REQUEST | Yêu cầu không hợp lệ |
| 404 | NOT_FOUND | Không tìm thấy |
| 422 | VALIDATION_ERROR | Lỗi validation |
| 500 | SERVER_ERROR | Lỗi server |

---

## Validation Rules

### Tên người dùng (name)
- Bắt buộc
- Kiểu: string
- Tối đa: 50 ký tự

### Tên đăng nhập (userName)
- Bắt buộc
- Kiểu: string
- Tối đa: 50 ký tự
- Phải unique trong hệ thống

### Email
- Bắt buộc
- Kiểu: email hợp lệ
- Tối đa: 50 ký tự
- Phải unique trong hệ thống

### Mật khẩu (password)
- Không bắt buộc (có thể tạo user không có password, ví dụ: Google OAuth)
- Tối thiểu: 6 ký tự khi có
- Được mã hóa bằng bcrypt
- Lưu trong bảng `auth_providers`, không phải bảng `users`
- Khi cập nhật: chỉ thay đổi khi trường password được gửi lên

### Vai trò (roleId)
- Bắt buộc
- Kiểu: integer
- Phải tồn tại trong bảng roles

### Trạng thái (isActive)
- Không bắt buộc
- Kiểu: boolean
- Mặc định: true

### Ảnh đại diện (image)
- Không bắt buộc
- Định dạng: jpeg, png, jpg, gif, webp
- Kích thước tối đa: 2MB
- Lưu tại: public/users/

### Số điện thoại (phone)
- Không bắt buộc
- Tối đa: 20 ký tự

### Địa chỉ (address)
- Không bắt buộc
- Tối đa: 255 ký tự

### Ngày sinh (dateOfBirth)
- Không bắt buộc
- Định dạng: YYYY-MM-DD

---

## Cấu Trúc Database

### Bảng `users`
```sql
- id (bigint, primary key)
- name (varchar 50)
- userName (varchar 50, unique)
- imageUrl (varchar 255, nullable)
- email (varchar 50, unique)
- isActive (boolean, default: true)
- roleId (bigint, foreign key -> roles.id)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)
```

### Bảng `auth_providers`
```sql
- id (bigint, primary key)
- userId (bigint, foreign key -> users.id)
- provider (enum: LOCAL, GOOGLE, default: LOCAL)
- providerId (varchar 255, nullable)
- password (varchar 255, nullable)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Bảng `user_profile`
```sql
- id (bigint, primary key)
- userId (bigint, unique, foreign key -> users.id)
- phone (varchar 20, nullable)
- address (varchar 255, nullable)
- dateOfBirth (date, nullable)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)
```

---

## Quan Hệ (Relationships)

### User Model
- `belongsTo` Role (roleId)
- `hasOne` UserProfile (userId)
- `hasMany` AuthProvider (userId)
- `hasOne` Cart (userId)
- `hasMany` Order (userId)
- `hasMany` Review (userId)
- `hasMany` ChatBoxMessage (userId)

---

## Bảo Mật

1. **Authentication**: Tất cả các endpoint đều yêu cầu JWT token hợp lệ
2. **Authorization**: Chỉ admin mới có quyền truy cập
3. **Password Hashing**: Mật khẩu được mã hóa bằng bcrypt và lưu trong bảng `auth_providers`
4. **Password Hidden**: Mật khẩu không được trả về trong response
5. **Soft Delete**: Dữ liệu không bị xóa vĩnh viễn
6. **File Upload**: Validate định dạng và kích thước file
7. **Multi-Provider Support**: Hỗ trợ nhiều phương thức đăng nhập (LOCAL, GOOGLE)

---

## Best Practices

1. **Pagination**: Luôn sử dụng pagination cho danh sách người dùng
2. **Search**: Sử dụng endpoint search thay vì filter trên client
3. **Image Upload**: Kiểm tra kích thước và định dạng trước khi upload
4. **Password Update**: Chỉ gửi password khi thực sự muốn thay đổi
5. **Error Handling**: Luôn kiểm tra response status và xử lý lỗi phù hợp
6. **Validation**: Validate dữ liệu ở cả client và server side

---

## Testing với Postman/Thunder Client

### 1. Lấy danh sách
```
GET http://localhost:8000/api/admin/users?per_page=10
Headers:
  Authorization: Bearer {your-jwt-token}
```

### 2. Tạo mới
```
POST http://localhost:8000/api/admin/users
Headers:
  Authorization: Bearer {your-jwt-token}
  Content-Type: multipart/form-data
Body (form-data):
  name: Nguyễn Văn A
  userName: nguyenvana
  email: nguyenvana@example.com
  password: password123
  roleId: 2
  isActive: true
  image: [file]
  phone: 0123456789
  address: 123 Đường ABC
  dateOfBirth: 1990-01-01
```

### 3. Cập nhật
```
POST http://localhost:8000/api/admin/users/1
Headers:
  Authorization: Bearer {your-jwt-token}
  Content-Type: multipart/form-data
Body (form-data):
  name: Nguyễn Văn A Updated
  userName: nguyenvana
  email: nguyenvana@example.com
  roleId: 2
  isActive: false
```

### 4. Xóa
```
DELETE http://localhost:8000/api/admin/users/1
Headers:
  Authorization: Bearer {your-jwt-token}
```

---

## Lưu Ý Quan Trọng

1. **Middleware**: Đảm bảo admin middleware được áp dụng cho tất cả routes
2. **File Storage**: Thư mục `public/users` phải có quyền write
3. **Database**: Đảm bảo bảng roles có dữ liệu trước khi tạo user
4. **Validation**: Tất cả validation đều được xử lý ở service layer
5. **Transaction**: Sử dụng DB transaction để đảm bảo tính toàn vẹn dữ liệu
6. **Clean Code**: Code tuân theo pattern của ProductService để dễ bảo trì
