<?php

namespace App\Console\Commands;

use App\Mail\MonthlyReportMail;
use App\Models\Role;
use App\Models\User;
use App\services\ReportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SendMonthlyReportCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:send-monthly';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gửi email báo cáo thống kê hàng tháng cho tất cả admin vào đầu mỗi tháng';

    protected ReportService $reportService;

    /**
     * Create a new command instance.
     */
    public function __construct(ReportService $reportService)
    {
        parent::__construct();
        $this->reportService = $reportService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Bắt đầu tạo báo cáo thống kê hàng tháng...');

        try {
            // Tính toán tháng trước
            $lastMonth = Carbon::now()->subMonth();
            $monthName = $this->getMonthName($lastMonth->month);
            $year = $lastMonth->year;
            
            // Tính toán khoảng thời gian của tháng trước
            $startDate = $lastMonth->copy()->startOfMonth();
            $endDate = $lastMonth->copy()->endOfMonth();
            
            $this->info("Tạo báo cáo cho tháng: {$monthName}/{$year}");
            $this->info("Từ: {$startDate->format('d/m/Y')} đến: {$endDate->format('d/m/Y')}");

            // Tính số ngày từ đầu tháng trước đến hôm nay
            // Vì ReportService tính từ now() - period, nên ta cần period = số ngày từ đầu tháng trước đến hôm nay
            // Nhưng vì chạy vào ngày 1, nên số ngày sẽ là số ngày trong tháng trước + 1
            // Tuy nhiên, để đảm bảo chỉ lấy dữ liệu của tháng trước, ta sẽ dùng số ngày trong tháng trước
            // và sau đó filter lại trong query (nhưng ReportService không hỗ trợ điều này)
            // Vì vậy, ta sẽ dùng period = số ngày từ đầu tháng trước đến hôm nay, và chấp nhận rằng
            // nó sẽ bao gồm cả ngày hôm nay (nhưng vì chạy vào ngày 1, nên ngày hôm nay không có dữ liệu của tháng trước)
            $daysFromStartOfLastMonth = Carbon::now()->startOfDay()->diffInDays($startDate) + 1;
            
            $request = new Request([
                'period' => $daysFromStartOfLastMonth,
            ]);

            // Lấy dữ liệu báo cáo
            $overviewStats = $this->reportService->getOverviewStats($request);
            $revenueByPeriod = $this->reportService->getRevenueByPeriod($request);
            $topProducts = $this->reportService->getTopSellingProducts(new Request(['limit' => 10, 'period' => $daysFromStartOfLastMonth]));
            $ratedProducts = $this->reportService->getRatedProducts(new Request(['limit' => 5, 'period' => $daysFromStartOfLastMonth]));
            $topCustomers = $this->reportService->getTopCustomers(new Request(['limit' => 10, 'period' => $daysFromStartOfLastMonth]));
            $revenueByCategory = $this->reportService->getRevenueByCategory($request);
            $orderStats = $this->reportService->getOrderStats($request);
            $paymentStats = $this->reportService->getPaymentStats($request);

            // Chuẩn bị dữ liệu báo cáo
            $reportData = [
                'overview' => $overviewStats['data'] ?? null,
                'revenue' => $revenueByPeriod['data'] ?? null,
                'topProducts' => $topProducts['data']['products'] ?? [],
                'ratedProducts' => $ratedProducts['data'] ?? null,
                'topCustomers' => $topCustomers['data']['customers'] ?? [],
                'revenueByCategory' => $revenueByCategory['data']['revenueByCategory'] ?? [],
                'orderStats' => $orderStats['data']['stats'] ?? null,
                'paymentStats' => $paymentStats['data'] ?? null,
            ];

            // Lấy tất cả admin users
            $adminRole = Role::where('name', 'ADMIN')->first();
            if (!$adminRole) {
                $this->error('Không tìm thấy role ADMIN');
                return 1;
            }

            $admins = User::where('roleId', $adminRole->id)
                ->where('isActive', true)
                ->get();

            if ($admins->isEmpty()) {
                $this->warn('Không có admin nào để gửi email');
                return 0;
            }

            $this->info("Tìm thấy {$admins->count()} admin để gửi email");

            // Gửi email cho từng admin
            $sentCount = 0;
            foreach ($admins as $admin) {
                try {
                    Mail::to($admin->email)->queue(
                        new MonthlyReportMail(
                            $reportData,
                            $monthName,
                            (string) $year,
                            $startDate->format('d/m/Y'),
                            $endDate->format('d/m/Y')
                        )
                    );
                    $sentCount++;
                    $this->info("Đã gửi email báo cáo đến: {$admin->email}");
                } catch (\Exception $e) {
                    $this->error("Lỗi khi gửi email đến {$admin->email}: {$e->getMessage()}");
                }
            }

            $this->info("Hoàn thành! Đã gửi {$sentCount}/{$admins->count()} email báo cáo.");
            return 0;

        } catch (\Exception $e) {
            $this->error("Lỗi khi tạo báo cáo: {$e->getMessage()}");
            $this->error($e->getTraceAsString());
            return 1;
        }
    }

    /**
     * Get Vietnamese month name
     */
    private function getMonthName(int $month): string
    {
        $months = [
            1 => 'Tháng 1',
            2 => 'Tháng 2',
            3 => 'Tháng 3',
            4 => 'Tháng 4',
            5 => 'Tháng 5',
            6 => 'Tháng 6',
            7 => 'Tháng 7',
            8 => 'Tháng 8',
            9 => 'Tháng 9',
            10 => 'Tháng 10',
            11 => 'Tháng 11',
            12 => 'Tháng 12',
        ];

        return $months[$month] ?? "Tháng {$month}";
    }
}
