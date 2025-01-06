<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserBlockLot extends Model
{
    use HasFactory;

    protected $table = 'user_block_lot';

    protected $fillable = ['user_id', 'block', 'lot'];

    // Many-to-One relationship to User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    // Relation to Family
    public function family()
    {
        return $this->belongsTo(Family::class, ['block', 'lot'], ['block', 'lot']);
    }
}
