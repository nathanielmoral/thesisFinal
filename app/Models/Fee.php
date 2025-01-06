<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fee extends Model
{
    use HasFactory, SoftDeletes; // Include SoftDeletes trait

    protected $fillable = [
        'name',
        'description',
        'amount',
    ];

    public function blockLotFees()
    {
        return $this->hasMany(BlockLotFee::class, 'fee_id');
    }
}
