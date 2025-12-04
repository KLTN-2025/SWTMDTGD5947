<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoCancelUnpaidOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:auto-cancel-unpaid';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động hủy các đơn hàng chưa thanh toán sau 1 giờ';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Đang kiểm tra các đơn hàng chưa thanh toán...');

        try {
            // Lấy thời điểm 1 giờ trước
            $oneHourAgo = Carbon::now()->subHour();

            // Tìm các đơn hàng:
            // - Status = PENDING (chưa xác nhận)
            // - PaymentStatus = PENDING hoặc FAILED (chưa thanh toán hoặc thanh toán thất bại)
            // - Tạo từ 1 giờ trước trở về trước
            $orders = Order::where('status', Order::STATUS_PENDING)
                ->whereIn('paymentStatus', [Order::PAYMENT_STATUS_PENDING, Order::PAYMENT_STATUS_FAILED])
                ->where('createdAt', '<=', $oneHourAgo)
                ->with(['items.productVariant.product'])
                ->get();

            if ($orders->isEmpty()) {
                $this->info('Không có đơn hàng nào cần hủy.');
                return 0;
            }

            $cancelledCount = 0;

            foreach ($orders as $order) {
                DB::transaction(function () use ($order, &$cancelledCount) {
                    // Cập nhật trạng thái đơn hàng
                    $order->status = Order::STATUS_CANCELLED;
                    $order->paymentStatus = Order::PAYMENT_STATUS_CANCELLED;
                    $order->save();

                    // Hoàn lại stock sản phẩm
                    foreach ($order->items as $item) {
                        $product = $item->productVariant->product;
                        if (isset($product->quantity)) {
                            $product->quantity += $item->quantity;
                            
                            // Nếu sản phẩm đang SOLD_OUT, chuyển về IN_STOCK
                            if ($product->status === Product::STATUS_SOLD_OUT && $product->quantity > 0) {
                                $product->status = Product::STATUS_IN_STOCK;
                            }
                            
                            $product->save();
                        }
                    }

                    $cancelledCount++;
                    
                    Log::info('Auto-cancelled unpaid order', [
                        'orderId' => $order->id,
                        'createdAt' => $order->createdAt,
                        'amount' => $order->amount
                    ]);
                });
            }

            $this->info("Đã hủy {$cancelledCount} đơn hàng chưa thanh toán.");
            
            return 0;

        } catch (\Exception $e) {
            $this->error('Lỗi khi hủy đơn hàng: ' . $e->getMessage());
            Log::error('Auto-cancel unpaid orders failed: ' . $e->getMessage());
            return 1;
        }
    }
}
