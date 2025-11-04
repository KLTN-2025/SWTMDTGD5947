<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductImage extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'product_images';

    protected $fillable = [
        'productId',
        'url',
    ];

    protected $appends = ['fullUrl'];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    /**
     * Get full URL for the image
     */
    public function getFullUrlAttribute()
    {
        if (!$this->url) {
            return null;
        }

        // If already a full URL, return as is
        if (str_starts_with($this->url, 'http://') || str_starts_with($this->url, 'https://')) {
            return $this->url;
        }

        // Build full URL
        return url($this->url);
    }

    // Many-to-one relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class, 'productId');
    }
}
