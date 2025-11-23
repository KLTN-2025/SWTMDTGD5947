<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminOrderPlacedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order->loadMissing([
            'user',
            'items.productVariant.product.images',
            'items.productVariant.product.colors',
            'items.productVariant.size',
            'items.color',
        ]);
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $customerName = $this->order->user->name
            ?? $this->order->user->userName
            ?? 'Khách hàng';

        $subject = sprintf('Đơn hàng mới #%s từ %s', $this->order->id, $customerName);

        return $this->subject($subject)
            ->view('emails.order.admin-notification')
            ->with([
                'order' => $this->order,
                'customer' => $this->order->user,
                'items' => $this->order->items,
                'paymentMethodLabel' => $this->mapPaymentMethod($this->order->paymentMethod),
            ]);
    }

    private function mapPaymentMethod(?string $method): string
    {
        return match ($method) {
            'CREDIT_CARD' => 'Thanh toán bằng thẻ',
            'E_WALLET' => 'Ví điện tử',
            'BANK_TRANSFER' => 'Chuyển khoản ngân hàng',
            default => 'Thanh toán khi nhận hàng (COD)',
        };
    }
}

