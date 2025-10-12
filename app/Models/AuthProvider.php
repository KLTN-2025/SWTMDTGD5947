<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuthProvider extends Model
{
    use HasFactory;

    protected $table = 'auth_providers';

    protected $fillable = [
        'userId',
        'provider',
        'providerId',
        'password',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
