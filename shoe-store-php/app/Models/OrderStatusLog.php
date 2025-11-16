<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderStatusLog extends Model
{
    use HasFactory;

    protected $table = 'order_status_logs';
    
    protected $fillable = [
        'orderId',
        'oldStatus',
        'newStatus',
        'changedBy',
        'note'
    ];

    protected $casts = [
        'createdAt' => 'datetime',
    ];

    public $timestamps = false;

    /**
     * Get the order that owns the status log.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'orderId');
    }

    /**
     * Get the user who changed the status.
     */
    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changedBy');
    }
}
