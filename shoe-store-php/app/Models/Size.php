<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Size extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sizes';

    protected $fillable = [
        'nameSize',
        'description',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    // One-to-many relationship with product variants
    public function productVariants()
    {
        return $this->hasMany(ProductVariant::class, 'sizeId');
    }
}
