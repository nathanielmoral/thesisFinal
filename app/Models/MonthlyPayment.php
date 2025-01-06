<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlyPayment extends Model
{
    protected $fillable = [
        'user_id',
        'transaction_reference',
        'amount',
        'proof_of_payment',
        'period_covered',
        'is_approved',
        'mode_of_payment', // Include new column
        'transaction_date', // Include new column
        'fee_id',
        'fee_name',
    ];

    public function user()
    {
        return $this->belongsTo(User::class,'user_id')->withTrashed();
    }
    
    public function blockLotFee()
{
    return $this->belongsTo(BlockLotFee::class, 'block_lot_fee_id');
}

    public function users()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function fees()
    {
        return $this->hasMany(BlockLotFee::class, 'transaction_reference', 'transaction_reference', 'fee_id');
    }

}
