<?php

namespace App\Models;

use App\Helper\Constants;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Role;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'userName',
        'imageUrl',
        'email',
        'isActive',
        'roleId',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'createdAt' => 'datetime',
        'updatedAt' => 'datetime',
        'deletedAt' => 'datetime',
    ];

    const STATUS_ACTIVE = 'ACTIVE';
    const STATUS_INACTIVE = 'INACTIVE';
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    public $timestamps = true;
    public function role()
    {
        return $this->belongsTo(Role::class, 'roleId');
    }

    // User có 1 profile (1-1)
    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'userId');
    }

    // User có nhiều AuthProviders (1-n)
    public function authProvider()
    {
        return $this->hasMany(AuthProvider::class, 'userId');
    }

    // User có 1 cart (1-1)
    public function cart()
    {
        return $this->hasOne(Cart::class, 'userId');
    }

    // User có nhiều orders (1-n)
    public function orders()
    {
        return $this->hasMany(Order::class, 'userId');
    }

    // User có nhiều reviews (1-n)
    public function reviews()
    {
        return $this->hasMany(Review::class, 'userId');
    }

    // User có nhiều chat box messages (1-n)
    public function chatBoxMessages()
    {
        return $this->hasMany(ChatBoxMessage::class, 'userId');
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'email' => $this->email,
            'userName' => $this->userName,
            'role' => $this->role->name ?? Constants::USER,
            'provider' => $this->authProvider()->provider ?? null,
        ];
    }

    public function checkUserExsis($email)
    {
        $user = User::where('email', $email)->first();
        return $user;
    }

    public function getRoleByName($name)
    {
        $role = Role::where('name', $name)->first();
        return $role;
    }
}
