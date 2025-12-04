<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'orders';

    protected $fillable = [
        'userId',
        'status',
        'amount',
        'deliveryAddress',
        'paymentMethod',
        'paymentStatus',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    const STATUS_PENDING = 'PENDING';
    const STATUS_CONFIRMED = 'CONFIRMED';
    const STATUS_SHIPPED = 'SHIPPED';
    const STATUS_COMPLETED = 'COMPLETED';
    const STATUS_CANCELLED = 'CANCELLED';

    const PAYMENT_METHOD_CASH = 'CASH';
    const PAYMENT_METHOD_CREDIT_CARD = 'CREDIT_CARD';
    const PAYMENT_METHOD_E_WALLET = 'E_WALLET';
    const PAYMENT_METHOD_BANK_TRANSFER = 'BANK_TRANSFER';

    const PAYMENT_STATUS_PENDING = 'PENDING';
    const PAYMENT_STATUS_UNPAID = 'UNPAID';
    const PAYMENT_STATUS_PAID = 'PAID';
    const PAYMENT_STATUS_CANCELLED = 'CANCELLED';
    const PAYMENT_STATUS_REFUNDED = 'REFUNDED';
    const PAYMENT_STATUS_FAILED = 'FAILED';

    // Many-to-one relationship with user
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    // One-to-many relationship with order items
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'orderId');
    }

    // One-to-one relationship with payment
    public function payment()
    {
        return $this->hasOne(Payment::class, 'orderId');
    }

    /**
     * Kiểm tra xem order có thể retry payment không
     * (chưa thanh toán và chưa quá 1 giờ)
     */
    public function canRetryPayment(): bool
    {
        // Phải ở trạng thái PENDING
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        // PaymentStatus phải là PENDING hoặc FAILED
        if (!in_array($this->paymentStatus, [self::PAYMENT_STATUS_PENDING, self::PAYMENT_STATUS_FAILED])) {
            return false;
        }

        // Chưa quá 1 giờ kể từ khi tạo
        $createdAt = \Carbon\Carbon::parse($this->createdAt);
        $now = \Carbon\Carbon::now();
        $hoursSinceCreated = $createdAt->diffInHours($now);

        return $hoursSinceCreated < 1;
    }

    /**
     * Lấy thời gian còn lại để thanh toán (phút)
     */
    public function getRemainingPaymentTimeInMinutes(): int
    {
        $createdAt = \Carbon\Carbon::parse($this->createdAt);
        $expiresAt = $createdAt->addHour();
        $now = \Carbon\Carbon::now();

        if ($now->gte($expiresAt)) {
            return 0;
        }

        return $now->diffInMinutes($expiresAt);
    }
}
