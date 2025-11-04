<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HistoriesChatBox extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'histories_chat_box';

    protected $fillable = [
        'chatBoxId',
        'context',
        'message',
    ];

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';
    const DELETED_AT = 'deletedAt';

    // Many-to-one relationship with chat box message
    public function chatBox()
    {
        return $this->belongsTo(ChatBoxMessage::class, 'chatBoxId');
    }
}
