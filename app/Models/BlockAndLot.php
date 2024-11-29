<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockAndLot extends Model
{
    protected $fillable = [
        'block',
        'lot',
        'status',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
    public function family()
    {
        return $this->belongsTo(Family::class, 'family_id', 'id');
    }

}
