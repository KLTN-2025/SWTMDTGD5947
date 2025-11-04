<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $table = 'categories';

    protected $fillable = [
        'name',
        'parentId',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    // Self-referencing relationship for parent category
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parentId');
    }

    // Self-referencing relationship for child categories
    public function children()
    {
        return $this->hasMany(Category::class, 'parentId');
    }

    // Many-to-many relationship with products
    public function products()
    {
        return $this->belongsToMany(Product::class, 'category_product', 'categoryId', 'productId')
            ->withTimestamps();
    }
}
