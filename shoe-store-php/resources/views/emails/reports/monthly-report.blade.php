<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo thống kê {{ $monthName }}/{{ $year }}</title>
</head>
<body style="background-color:#f5f6fa;margin:0;padding:24px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1f2933;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:800px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <!-- Header -->
        <tr>
            <td style="padding:32px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff;">
                <p style="margin:0;font-size:14px;opacity:0.8;">ShoeX Admin Center</p>
                <h1 style="margin:8px 0 0;font-size:28px;font-weight:700;">Báo cáo thống kê {{ $monthName }}/{{ $year }}</h1>
                <p style="margin:6px 0 0;font-size:14px;color:#cbd5f5;">Từ {{ $periodStart }} đến {{ $periodEnd }}</p>
            </td>
        </tr>

        @if(isset($reportData['overview']))
        <!-- Overview Stats -->
        <tr>
            <td style="padding:28px 32px;">
                <h2 style="margin:0 0 20px;font-size:20px;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Tổng quan</h2>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr>
                        <td style="padding:16px;background-color:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a;">
                            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Tổng doanh thu</div>
                            <div style="font-size:24px;font-weight:700;color:#16a34a;">
                                {{ number_format($reportData['overview']['revenue']['total'] ?? 0, 0, ',', '.') }} ₫
                            </div>
                            @if(isset($reportData['overview']['revenue']['growth']))
                            @php
                                $revenueGrowthColor = $reportData['overview']['revenue']['growth'] >= 0 ? '#16a34a' : '#dc2626';
                                $revenueGrowthIcon = $reportData['overview']['revenue']['growth'] >= 0 ? '↑' : '↓';
                            @endphp
                            <div @if($reportData['overview']['revenue']['growth'] >= 0) style="font-size:12px;margin-top:4px;color:#16a34a;" @else style="font-size:12px;margin-top:4px;color:#dc2626;" @endif>
                                {{ $revenueGrowthIcon }} {{ abs($reportData['overview']['revenue']['growth']) }}% so với tháng trước
                            </div>
                            @endif
                        </td>
                        <td width="16"></td>
                        <td style="padding:16px;background-color:#eff6ff;border-radius:8px;border-left:4px solid #2563eb;">
                            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Tổng đơn hàng</div>
                            <div style="font-size:24px;font-weight:700;color:#2563eb;">
                                {{ number_format($reportData['overview']['orders']['total'] ?? 0, 0, ',', '.') }}
                            </div>
                            @if(isset($reportData['overview']['orders']['growth']))
                            @php
                                $ordersGrowthIcon = $reportData['overview']['orders']['growth'] >= 0 ? '↑' : '↓';
                            @endphp
                            <div @if($reportData['overview']['orders']['growth'] >= 0) style="font-size:12px;margin-top:4px;color:#16a34a;" @else style="font-size:12px;margin-top:4px;color:#dc2626;" @endif>
                                {{ $ordersGrowthIcon }} {{ abs($reportData['overview']['orders']['growth']) }}% so với tháng trước
                            </div>
                            @endif
                        </td>
                    </tr>
                    <tr><td colspan="3" height="16"></td></tr>
                    <tr>
                        <td style="padding:16px;background-color:#fef3c7;border-radius:8px;border-left:4px solid #d97706;">
                            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Khách hàng mới</div>
                            <div style="font-size:24px;font-weight:700;color:#d97706;">
                                {{ number_format($reportData['overview']['customers']['new'] ?? 0, 0, ',', '.') }}
                            </div>
                            @if(isset($reportData['overview']['customers']['growth']))
                            @php
                                $customersGrowthIcon = $reportData['overview']['customers']['growth'] >= 0 ? '↑' : '↓';
                            @endphp
                            <div @if($reportData['overview']['customers']['growth'] >= 0) style="font-size:12px;margin-top:4px;color:#16a34a;" @else style="font-size:12px;margin-top:4px;color:#dc2626;" @endif>
                                {{ $customersGrowthIcon }} {{ abs($reportData['overview']['customers']['growth']) }}% so với tháng trước
                            </div>
                            @endif
                        </td>
                        <td width="16"></td>
                        <td style="padding:16px;background-color:#f3e8ff;border-radius:8px;border-left:4px solid #9333ea;">
                            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Giá trị đơn hàng trung bình</div>
                            <div style="font-size:24px;font-weight:700;color:#9333ea;">
                                {{ number_format($reportData['overview']['revenue']['averageOrderValue'] ?? 0, 0, ',', '.') }} ₫
                            </div>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;background-color:#f9fafb;border-radius:8px;padding:16px;">
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đơn hàng hoàn thành</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">
                            {{ number_format($reportData['overview']['orders']['completed'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đơn hàng đang chờ</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">
                            {{ number_format($reportData['overview']['orders']['pending'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đơn hàng đã hủy</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">
                            {{ number_format($reportData['overview']['orders']['cancelled'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Tỷ lệ chuyển đổi</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">
                            {{ number_format($reportData['overview']['customers']['conversionRate'] ?? 0, 2, ',', '.') }}%
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        @endif

        @if(isset($reportData['topProducts']) && count($reportData['topProducts']) > 0)
        <!-- Top Products -->
        <tr>
            <td style="padding:0 32px 28px;">
                <h2 style="margin:0 0 16px;font-size:20px;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Top 10 sản phẩm bán chạy</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <thead>
                        <tr style="background-color:#f3f4f6;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">
                            <th align="left" style="padding:10px;border-radius:8px 0 0 0;">Sản phẩm</th>
                            <th align="center" style="padding:10px;">Đã bán</th>
                            <th align="right" style="padding:10px;border-radius:0 8px 0 0;">Doanh thu</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach(array_slice($reportData['topProducts'], 0, 10) as $index => $product)
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 10px;">
                                <div style="font-weight:600;color:#0f172a;">{{ $product['productName'] ?? 'N/A' }}</div>
                                <div style="font-size:12px;color:#64748b;margin-top:2px;">SKU: {{ $product['skuId'] ?? '—' }}</div>
                            </td>
                            <td align="center" style="padding:12px 10px;font-weight:600;color:#111827;">{{ number_format($product['totalSold'] ?? 0, 0, ',', '.') }}</td>
                            <td align="right" style="padding:12px 10px;font-weight:600;color:#16a34a;">
                                {{ number_format($product['totalRevenue'] ?? 0, 0, ',', '.') }} ₫
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
        @endif

        @if(isset($reportData['topCustomers']) && count($reportData['topCustomers']) > 0)
        <!-- Top Customers -->
        <tr>
            <td style="padding:0 32px 28px;">
                <h2 style="margin:0 0 16px;font-size:20px;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Top 10 khách hàng</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <thead>
                        <tr style="background-color:#f3f4f6;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">
                            <th align="left" style="padding:10px;border-radius:8px 0 0 0;">Khách hàng</th>
                            <th align="center" style="padding:10px;">Số đơn</th>
                            <th align="right" style="padding:10px;border-radius:0 8px 0 0;">Tổng chi tiêu</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach(array_slice($reportData['topCustomers'], 0, 10) as $customer)
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 10px;">
                                <div style="font-weight:600;color:#0f172a;">{{ $customer['name'] ?? 'N/A' }}</div>
                                <div style="font-size:12px;color:#64748b;margin-top:2px;">{{ $customer['email'] ?? '—' }}</div>
                            </td>
                            <td align="center" style="padding:12px 10px;font-weight:600;color:#111827;">{{ number_format($customer['orderCount'] ?? 0, 0, ',', '.') }}</td>
                            <td align="right" style="padding:12px 10px;font-weight:600;color:#16a34a;">
                                {{ number_format($customer['totalSpent'] ?? 0, 0, ',', '.') }} ₫
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
        @endif

        @if(isset($reportData['revenueByCategory']) && count($reportData['revenueByCategory']) > 0)
        <!-- Revenue by Category -->
        <tr>
            <td style="padding:0 32px 28px;">
                <h2 style="margin:0 0 16px;font-size:20px;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Doanh thu theo danh mục</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <thead>
                        <tr style="background-color:#f3f4f6;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">
                            <th align="left" style="padding:10px;border-radius:8px 0 0 0;">Danh mục</th>
                            <th align="center" style="padding:10px;">Số lượng</th>
                            <th align="right" style="padding:10px;border-radius:0 8px 0 0;">Doanh thu</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($reportData['revenueByCategory'] as $category)
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 10px;font-weight:600;color:#0f172a;">{{ $category['categoryName'] ?? 'N/A' }}</td>
                            <td align="center" style="padding:12px 10px;color:#111827;">{{ number_format($category['totalQuantity'] ?? 0, 0, ',', '.') }}</td>
                            <td align="right" style="padding:12px 10px;font-weight:600;color:#16a34a;">
                                {{ number_format($category['totalRevenue'] ?? 0, 0, ',', '.') }} ₫
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
        @endif

        @if(isset($reportData['orderStats']))
        <!-- Order Stats -->
        <tr>
            <td style="padding:0 32px 28px;">
                <h2 style="margin:0 0 16px;font-size:20px;color:#111827;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Thống kê đơn hàng</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;background-color:#f9fafb;border-radius:8px;padding:16px;">
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đang chờ xử lý</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">
                            {{ number_format($reportData['orderStats']['PENDING']['count'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đã xác nhận</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">
                            {{ number_format($reportData['orderStats']['CONFIRMED']['count'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đang giao hàng</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">
                            {{ number_format($reportData['orderStats']['SHIPPED']['count'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đã hoàn thành</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#16a34a;">
                            {{ number_format($reportData['orderStats']['COMPLETED']['count'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#64748b;">Đã hủy</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;color:#dc2626;">
                            {{ number_format($reportData['orderStats']['CANCELLED']['count'] ?? 0, 0, ',', '.') }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        @endif

        <!-- Footer -->
        <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:13px;color:#64748b;text-align:center;">
                    Email này được gửi tự động vào đầu mỗi tháng với báo cáo thống kê của tháng trước.
                </p>
                <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
                    Vui lòng đăng nhập trang quản trị để xem thêm chi tiết và các báo cáo khác.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>

