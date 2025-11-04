<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cart extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'carts';

    protected $fillable = [
        'userId',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    // Many-to-one relationship with user
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    // One-to-many relationship with cart items
    public function items()
    {
        return $this->hasMany(CartItem::class, 'cartId');
    }
}
