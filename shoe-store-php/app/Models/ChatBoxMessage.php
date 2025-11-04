<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatBoxMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'chat_box_messages';

    protected $fillable = [
        'userId',
        'categoryId',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    // Many-to-one relationship with user
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    // One-to-many relationship with chat histories
    public function histories()
    {
        return $this->hasMany(HistoriesChatBox::class, 'chatBoxId');
    }
}
