<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $table = 'order_items';

    protected $fillable = [
        'productVariantId',
        'orderId',
        'quantity',
        'amount',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    // Many-to-one relationship with product variant
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class, 'productVariantId');
    }

    // Many-to-one relationship with order
    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId');
    }
}
