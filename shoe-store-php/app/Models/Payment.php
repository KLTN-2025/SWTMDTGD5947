<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'orderId',
        'status',
        'amount',
        'transactionCode',
        'accountNumber',
        'bankCode',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    const STATUS_PENDING = 'PENDING';
    const STATUS_UNPAID = 'UNPAID';
    const STATUS_PAID = 'PAID';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_REFUNDED = 'REFUNDED';
    const STATUS_FAILED = 'FAILED';

    // Many-to-one relationship with order
    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId');
    }
}
