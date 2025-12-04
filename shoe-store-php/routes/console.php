<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule monthly report email to be sent on the 1st day of each month at 8:00 AM
Schedule::command('reports:send-monthly')
    ->monthlyOn(1, '08:00')
    ->timezone('Asia/Ho_Chi_Minh')
    ->description('Gửi email báo cáo thống kê hàng tháng cho tất cả admin');

// Auto-cancel unpaid orders after 1 hour (chạy mỗi 10 phút)
Schedule::command('orders:auto-cancel-unpaid')
    ->everyTenMinutes()
    ->timezone('Asia/Ho_Chi_Minh')
    ->description('Tự động hủy các đơn hàng chưa thanh toán sau 1 giờ');
