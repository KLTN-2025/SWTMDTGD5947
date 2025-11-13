<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'products';

    protected $fillable = [
        'skuId',
        'name',
        'status',
        'description',
        'basePrice',
        'quantity',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    const STATUS_SOLD_OUT = 'SOLD_OUT';
    const STATUS_IN_STOCK = 'IN_STOCK';
    const STATUS_PRE_SALE = 'PRE_SALE';

    // One-to-many relationship with product images
    public function images()
    {
        return $this->hasMany(ProductImage::class, 'productId');
    }

    // One-to-many relationship with product variants
    public function variants()
    {
        return $this->hasMany(ProductVariant::class, 'productId');
    }

    // Many-to-many relationship with categories
    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_product', 'productId', 'categoryId')
            ->withTimestamps();
    }

    // One-to-many relationship with reviews
    public function reviews()
    {
        return $this->hasMany(Review::class, 'productId');
    }
}
