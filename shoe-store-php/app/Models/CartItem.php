<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CartItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cart_items';

    protected $fillable = [
        'cartId',
        'productVariantId',
        'quantity',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    // Many-to-one relationship with cart
    public function cart()
    {
        return $this->belongsTo(Cart::class, 'cartId');
    }

    // Many-to-one relationship with product variant
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class, 'productVariantId');
    }
}
