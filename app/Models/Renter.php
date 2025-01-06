<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Renter extends Model
{
    use HasFactory;

    protected $table = 'renters';

    protected $fillable = ['user_id', 'block_lot_id', 'status'];

    // Relasyon sa User (Renters are users)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function blockLot()
    {
        return $this->belongsTo(BlockAndLot::class, 'block_lot_id');
    }
    
}
