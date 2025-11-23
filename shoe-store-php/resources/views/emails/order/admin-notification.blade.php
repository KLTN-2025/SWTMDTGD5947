<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Thông báo đơn hàng mới</title>
</head>
<body style="background-color:#f5f6fa;margin:0;padding:24px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1f2933;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <tr>
            <td style="padding:32px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff;">
                <p style="margin:0;font-size:14px;opacity:0.8;">ShoeX Admin Center</p>
                <h1 style="margin:8px 0 0;font-size:26px;">Đơn hàng mới #{{ $order->id }}</h1>
                <p style="margin:6px 0 0;font-size:14px;color:#cbd5f5;">Thời gian: {{ $order->createdAt?->timezone('Asia/Ho_Chi_Minh')->format('H:i d/m/Y') }}</p>
            </td>
        </tr>
        <tr>
            <td style="padding:28px 32px 16px;">
                <h2 style="margin:0 0 12px;font-size:18px;">Thông tin khách hàng</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                    <tr>
                        <td style="padding:6px 0;color:#64748b;">Họ tên</td>
                        <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">{{ $customer->name ?? $customer->userName }}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#64748b;">Email</td>
                        <td style="padding:6px 0;color:#111827;text-align:right;">{{ $customer->email }}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#64748b;">Địa chỉ giao hàng</td>
                        <td style="padding:6px 0;color:#111827;text-align:right;">{{ $order->deliveryAddress }}</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#64748b;">Phương thức thanh toán</td>
                        <td style="padding:6px 0;color:#111827;text-align:right;">{{ $paymentMethodLabel }}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:16px 32px;">
                <h2 style="margin:0 0 12px;font-size:18px;">Chi tiết sản phẩm</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <thead>
                        <tr style="background-color:#f3f4f6;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">
                            <th align="left" style="padding:10px;border-radius:10px 0 0 10px;">Sản phẩm</th>
                            <th align="center" style="padding:10px;">SL</th>
                            <th align="right" style="padding:10px;border-radius:0 10px 10px 0;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($items as $item)
                            @php
                                $product = $item->productVariant->product;
                                $size = $item->productVariant->size;
                                $color = $item->color;
                            @endphp
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:14px 10px;">
                                    <div style="font-weight:600;color:#0f172a;">{{ $product->name }}</div>
                                    <div style="font-size:12px;color:#64748b;margin-top:2px;">
                                        SKU: {{ $product->skuId }} |
                                        Size: {{ $size->nameSize ?? '—' }} |
                                        Màu: {{ $color->name ?? '—' }}
                                    </div>
                                </td>
                                <td align="center" style="padding:14px 10px;font-weight:600;color:#111827;">{{ $item->quantity }}</td>
                                <td align="right" style="padding:14px 10px;font-weight:600;color:#16a34a;">
                                    {{ number_format($item->amount, 0, ',', '.') }} ₫
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:16px 32px 8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                    <tr>
                        <td style="padding:6px 0;color:#64748b;">Tạm tính</td>
                        <td style="padding:6px 0;text-align:right;color:#0f172a;">{{ number_format($items->sum('amount'), 0, ',', '.') }} ₫</td>
                    </tr>
                    <tr>
                        <td style="padding:6px 0;color:#64748b;">Phí vận chuyển</td>
                        <td style="padding:6px 0;text-align:right;color:#0f172a;">—</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;font-size:18px;font-weight:700;color:#111827;">Tổng thanh toán</td>
                        <td style="padding:8px 0;text-align:right;font-size:20px;font-weight:700;color:#16a34a;">{{ number_format($order->amount, 0, ',', '.') }} ₫</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:0 32px 40px;">
                <div style="padding:16px;border:1px dashed #cbd5f5;border-radius:12px;background-color:#f8fafc;">
                    <p style="margin:0;font-size:13px;color:#475569;">
                        Vui lòng đăng nhập trang quản trị để xem thêm chi tiết và xử lý đơn hàng.
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Email này được gửi tự động khi người dùng đặt hàng thành công.</p>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>

