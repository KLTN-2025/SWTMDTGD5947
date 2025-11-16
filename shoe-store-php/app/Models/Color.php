<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Color extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'colors';

    protected $fillable = [
        'name',
        'hexCode',
        'description',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    // Many-to-many relationship with products
    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_color', 'colorId', 'productId')
            ->withTimestamps();
    }
}

