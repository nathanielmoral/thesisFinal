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
        'family_id', 
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id','block_lot_id');
    }
    public function family()
    {
        return $this->belongsTo(Family::class, 'family_id', 'id');
    }
}
