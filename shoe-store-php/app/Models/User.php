<?php

namespace App\Models;

use App\Helper\Constants;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Role;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'userName',
        'imageUrl',
        'email',
        'isActive',
        'status',
        'roleId',
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
