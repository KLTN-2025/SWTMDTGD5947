<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $table = 'product_variants';

    protected $fillable = [
        'productId',
        'sizeId',
        'price',
        'startDate',
        'endDate',
    ];

    protected $casts = [
        'startDate' => 'datetime',
        'endDate' => 'datetime',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    // Many-to-one relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class, 'productId');
    }

    // Many-to-one relationship with size
    public function size()
    {
        return $this->belongsTo(Size::class, 'sizeId');
    }

    // One-to-many relationship with cart items
    public function cartItems()
    {
        return $this->hasMany(CartItem::class, 'productVariantId');
    }

    // One-to-many relationship with order items
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'productVariantId');
    }
}
