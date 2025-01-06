<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BlockLotFee extends Model
{
    use HasFactory, SoftDeletes; // Include SoftDeletes trait

    protected $table = 'block_lot_fees';

    protected $fillable = [
        'fee_id', // ID of the fee from the fees table
        'account_holder_id', // ID of the account holder from the families table
        'month',  // Month (1 = January, 12 = December)
        'year',   // Year
        'transaction_reference',
        'proof_of_payment',
        'payment_status', // Payment status
        'mode_of_payment', // Mode of Payment (e.g., cash, bank transfer)
        'transaction_date', // Date of the transaction
        'amount_paid', // Add this
    ];

    // Add a deleted_at column to track soft deletes
    protected $dates = ['deleted_at'];

    public function fee()
    {
        return $this->belongsTo(Fee::class, 'fee_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'account_holder_id', 'id');
    }
    

    public function accountHolder()
    {
        return $this->belongsTo(User::class, 'account_holder_id','id');
    }

    public function getMonthNameAttribute()
    {
        return date("F", mktime(0, 0, 0, $this->month, 10)); // e.g., January, February
    }

    public static function getDelayedPayments($search = null)
    {
        $currentYear = Carbon::now()->year;
        $currentMonth = Carbon::now()->month;

        return self::where(function ($query) use ($currentYear, $currentMonth) {
                $query->where('year', '<', $currentYear) // Previous years
                    ->orWhere(function ($subQuery) use ($currentYear, $currentMonth) {
                        $subQuery->where('year', $currentYear)
                                ->where('month', '<', $currentMonth); // Earlier months in the current year
                    });
            })
            ->where('payment_status', 'Unpaid')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('transaction_reference', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where(DB::raw("CONCAT(firstName, ' ', lastName)"), 'like', "%{$search}%");
                        });
                });
            })
            ->with('user')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate(10);
    }
    
    public static function getDelayedAllPayments()
    {
        $currentYear = Carbon::now()->year;
        $currentMonth = Carbon::now()->month;
    
        $payments = self::where(function ($query) use ($currentYear, $currentMonth) {
                $query->where('year', '<', $currentYear) // Previous years
                    ->orWhere(function ($subQuery) use ($currentYear, $currentMonth) {
                        $subQuery->where('year', $currentYear)
                                ->where('month', '<', $currentMonth);
                    });
            })
            ->where('payment_status', 'Unpaid')
            ->with('user')
            ->get();
    
        // Group payments by user and year
        $groupedPayments = $payments->groupBy(function ($payment) {
            return $payment->user->id . '-' . $payment->year; // Combine user ID and year as a unique key
        });
    
        // Transform the grouped data for better readability (optional)
        $result = $groupedPayments->map(function ($group) {
            return [
                'user' => $group->first()->user, // User details
                'year' => $group->first()->year, // Year
                'payments' => $group,           // All payments for this group
            ];
        });
    
        return $result;
    }
}
