<?php
namespace App\Http\Controllers;

use App\Models\{Fee,BlockLotFee,User,Family,MonthlyPayment};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;



class FeeController extends Controller
{
    public function index()
    {
        return response()->json(Fee::withoutTrashed()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric',
        ]);

        $fee = Fee::create($validated);
        return response()->json($fee, 201);
    }

    public function show(Fee $fee)
    {
        return response()->json($fee);
    }

    public function update(Request $request, Fee $fee)
{
    \Log::info('Update Request:', $request->all()); // Log incoming data

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'amount' => 'required|numeric',
    ]);

    try {
        $fee->update($validated);
        \Log::info('Fee updated successfully:', $fee->toArray());
        return response()->json($fee);
    } catch (\Exception $e) {
        \Log::error('Error updating fee:', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to update fee.'], 500);
    }
}


    public function destroy(Fee $fee)
    {
        \Log::info('Deleting Fee ID:', ['id' => $fee->id]); // Log the ID being deleted
        try {
            // If using soft deletes, forceDelete to permanently delete
            $fee->delete();
            \Log::info('Fee deleted successfully.');
            return response()->noContent();
        } catch (\Exception $e) {
            \Log::error('Error deleting fee:', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to delete fee.'], 500);
        }
    }

public function assignFee(Request $request)
{
    $request->validate([
        'fee_id' => 'required|exists:fees,id',
        'account_holder_id' => 'required|array', // Array of account holders
        'account_holder_id.*' => 'exists:users,id', // Validate each account holder
        'months' => 'required|array', // Validate months as array
        'months.*' => 'integer|between:1,12', // Validate months are valid
        'year' => 'required|integer|between:2000,2100', // Validate year
    ]);

    // Track families that have already been assigned fees
    $processedFamilies = [];

    foreach ($request->account_holder_id as $accountHolderId) {
        // Fetch the family_id and block/lot of the account holder
        $accountHolder = User::where('id', $accountHolderId)->first(['family_id', 'block', 'lot']);
        $familyId = $accountHolder->family_id;

        // Skip if this family has already been processed
        if (in_array($familyId, $processedFamilies)) {
            continue;
        }

        // Fetch the primary account holder for this family (by block and lot)
        $primaryAccountHolder = User::where('family_id', $familyId)
            ->where('block', $accountHolder->block)
            ->where('lot', $accountHolder->lot)
            ->where('is_account_holder', 1)
            ->first();

        // If no primary account holder exists, skip
        if (!$primaryAccountHolder) {
            continue;
        }

        // Prepare data for batch insertion
        $batchInsertData = [];
        foreach ($request->months as $month) {
            $batchInsertData[] = [
                'fee_id' => $request->fee_id,
                'account_holder_id' => $primaryAccountHolder->id, // Assign to the primary account holder
                'month' => $month,
                'year' => $request->year,
                'payment_status' => 'Unpaid',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert fees into the database in a single query
        if (!empty($batchInsertData)) {
            BlockLotFee::insert($batchInsertData);
        }

        // Mark this family as processed
        $processedFamilies[] = $familyId;
    }

    return response()->json(['message' => 'Fees assigned successfully to the primary account holders in each family.']);
}

    
    

public function getAccountHolders(Request $request)
{
    try {
        $accountHolders = User::where('is_account_holder', 1)->get(['id', 'firstName', 'lastName', 'email','account_number']);
        return response()->json($accountHolders, 200);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function fetchAllFees(Request $request)
{
    try {
        // Get the search query from the request
        $search = $request->query('search');

        // Query the BlockLotFee model with relationships
        $allFees = BlockLotFee::with(['fee'])
            ->when($search, function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('firstName', 'LIKE', '%' . $search . '%')
                        ->orWhere('middleName', 'LIKE', '%' . $search . '%')
                        ->orWhere('lastName', 'LIKE', '%' . $search . '%');
                });
            })
            ->get();

        // Append account holder information manually
        $allFees->each(function ($fee) {
            $accountHolder = User::select('id', 'firstName', 'lastName', 'block', 'lot','email','account_number')
                ->find($fee->account_holder_id);

            $fee->accountHolder = $accountHolder;
        });

        if ($allFees->isEmpty()) {
            return response()->json(['message' => 'No fees found.'], 404);
        }

        return response()->json($allFees, 200);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Failed to fetch all fees.',
            'error' => $e->getMessage(),
        ], 500);
    }
}


public function getUserFees(Request $request, $userId)
{
    try {
        // Retrieve filters from the request
        $year = $request->query('year');
        $status = $request->query('status'); // 'paid' or 'unpaid'
        $perPage = $request->query('per_page', 12); // Default to 12 items per page

        // Fetch the user's details to get block, lot, and family_id
        $user = User::select('id', 'firstName', 'middleName', 'lastName', 'block', 'lot', 'family_id')
            ->find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Fetch all users within the same block, lot, and family_id
        $authorizedUsers = User::where('block', $user->block)
            ->where('lot', $user->lot)
            ->where('family_id', $user->family_id)
            ->pluck('id');

        if ($authorizedUsers->isEmpty()) {
            return response()->json(['message' => 'No authorized users found.'], 403);
        }

        // Build query for fees
        $query = BlockLotFee::with('fee')
            ->whereIn('account_holder_id', $authorizedUsers);

        // Apply year filter
        if ($year) {
            $query->where('year', $year);
        }

        if ($status) {
            if ($status === 'paid') {
                $query->where('payment_status', 'Paid');
            } elseif ($status === 'unpaid') {
                $query->where('payment_status', 'Unpaid');
            } elseif ($status === 'processing') {
                $query->where('payment_status', 'Processing');
            }
        }
        
        // Paginate results
        $fees = $query->paginate($perPage);

        // Append account holder details to each fee
        $fees->getCollection()->each(function ($fee) use ($user) {
            $fee->accountHolder = $user;
        });

        return response()->json($fees, 200);
    } catch (\Exception $e) {
        \Log::error('Error fetching fees: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch fees. Please try again.'], 500);
    }
}




public function deleteFee($id)
{
    try {
        $fee = BlockLotFee::find($id);

        if (!$fee) {
            return response()->json(['message' => 'BlockLotFee record not found'], 404);
        }

        $fee->delete(); // Perform a soft delete
        return response()->json(['message' => 'BlockLotFee soft-deleted successfully'], 200);
    } catch (\Exception $e) {
        \Log::error('Error soft-deleting BlockLotFee: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to delete fee. Please try again.'], 500);
    }
}


public function updatePayment(Request $request, $id)
{
    $request->validate([
        'user_id' => 'required|integer|exists:users,id', 
        'year' => 'required|integer',
        'month' => 'required|integer|min:1|max:12',
        'proof_of_payment' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        'mode_of_payment' => 'required|string',
        'transaction_date' => 'required|date',
    ]);

    // Step 1: Find unpaid fees up to the selected month
    $blockLotFee = BlockLotFee::where('id', $id)
        ->where('year', $request->year)
        ->where('month', $request->month)
        ->where('payment_status', 'Unpaid')
        ->with('fee')
        ->first();

    if (!$blockLotFee) {
        return response()->json(['message' => 'No unpaid fee record found for the given month and year.'], 404);
    }

    // Step 2: Generate a transaction reference
    $date = now()->format('Ymd');
    $randomNumber = str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);
    $transaction_reference = "TRN-{$date}-{$randomNumber}";

    // Step 3: Store the proof of payment
    $proofPath = $request->file('proof_of_payment')->store('proof_of_payments', 'public');

       // Step 4: Set the transaction date to now()
       $formattedTransactionDate = now()->format('Y-m-d H:i:s');

    // Step 5: Mark unpaid months as "Processing"
    $unpaidPayments = BlockLotFee::where('account_holder_id', $blockLotFee->account_holder_id)
        ->where('year', $request->year)
        ->where('payment_status', 'Unpaid')
        ->where('month', '<=', $request->month)
        ->get();

    foreach ($unpaidPayments as $payment) {
        $payment->payment_status = 'Processing';
        $payment->proof_of_payment = $proofPath;
        $payment->transaction_reference = $transaction_reference;
        $payment->mode_of_payment = $request->mode_of_payment;
        $payment->transaction_date = $formattedTransactionDate;
        $payment->amount_paid = $payment->fee->amount ?? 0;
        $payment->updated_at = now();
        $payment->save();
    }

    // Step 6: Calculate total amount
    $totalAmount = $unpaidPayments->sum(function ($payment) {
        return $payment->fee->amount ?? 0;
    });

    // Step 7: Generate dynamic "period_covered" range
    $earliestMonth = $unpaidPayments->min('month'); // Get the earliest unpaid month
    $latestMonth = $unpaidPayments->max('month'); // Get the latest unpaid month

    // Convert months to readable format
    $startMonth = \DateTime::createFromFormat('!m', $earliestMonth)->format('F');
    $endMonth = \DateTime::createFromFormat('!m', $latestMonth)->format('F');

    // Check if there's only one month
    if ($startMonth === $endMonth) {
        $periodCovered = "{$startMonth} {$request->year}"; // Single month
    } else {
        $periodCovered = "{$startMonth} to {$endMonth} {$request->year}"; // Range of months
    }

    // Step 8: Create a MonthlyPayment record for tracking
    MonthlyPayment::create([
        'user_id' => $request->user_id, // Use the user_id from the request
        'transaction_reference' => $transaction_reference,
        'period_covered' => $periodCovered,
        'amount' => $totalAmount,
        'proof_of_payment' => $proofPath,
        'mode_of_payment' => $request->mode_of_payment,
        'transaction_date' => $formattedTransactionDate,
        'fee_id' => $blockLotFee->fee_id, // Add the fee_id directly from BlockLotFee
        'fee_name' => $blockLotFee->fee->name ?? 'N/A', // Access the related fee name
    ]);

    // Step 9: Return success response
    return response()->json([
        'message' => 'Payment submitted successfully. Pending approval.',
        'transaction_reference' => $transaction_reference,
        'total_amount' => $totalAmount,
        'months_paid' => $unpaidPayments->pluck('month'),
        'period_covered' => $periodCovered,
        'fee_name' => $blockLotFee->fee->name ?? 'N/A',
    ], 200);
}



public function fetchAccountDetails(Request $request)
{
    $request->validate(['account_number' => 'required|string']);

    // Find the user based on the account number
    $user = User::where('account_number', $request->account_number)->first();

    if (!$user) {
        return response()->json(['message' => 'Account not found'], 404);
    }

    // Determine query logic based on the user's role
    $feesQuery = BlockLotFee::whereHas('user', function ($query) use ($user) {
        $query->where('block', $user->block)
              ->where('lot', $user->lot);

        // If the user is a Homeowner, also check family_id
        if ($user->role === 'Homeowner') {
            $query->orWhere('family_id', $user->family_id);
        }
    });

    // Apply filters for unpaid fees and include related user data
    $fees = $feesQuery->where('payment_status', 'Unpaid')
                      ->with(['fee', 'user']) // Include fee and user details
                      ->get();

    return response()->json([
        'account_details' => $user,
        'fees' => $fees
    ]);
}


public function savePaymentTransaction(Request $request)
{
    $request->validate([
        'account_number' => 'required|string',
        'fee_ids' => 'required|array',
        'amount_tendered' => 'required|numeric|min:0',
        'mode_of_payment' => 'required|string',
        'year' => 'required|integer', // Validate the year field
    ]);

    $user = User::where('account_number', $request->account_number)->firstOrFail();

    $fees = BlockLotFee::whereIn('id', $request->fee_ids)
        ->where('account_holder_id', $user->id)
        ->where('payment_status', 'Unpaid')
        ->with('fee')
        ->get();

    $totalAmount = $fees->sum(fn($fee) => $fee->fee->amount);

    if ($request->amount_tendered < $totalAmount) {
        return response()->json(['message' => 'Insufficient amount'], 400);
    }

    DB::transaction(function () use ($fees, $request, $totalAmount, $user) {
        // Generate a unique transaction reference
        $date = now()->format('Ymd'); // Format date as YYYYMMDD
        $randomNumber = str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT); // Generate 5-digit random number
        $transactionReference = "TRN-{$date}-{$randomNumber}";

        // Determine the period covered
        $earliestMonth = $fees->min('month'); // Get the earliest unpaid month
        $latestMonth = $fees->max('month'); // Get the latest unpaid month

        // Convert months to readable format
        $startMonth = \DateTime::createFromFormat('!m', $earliestMonth)->format('F');
        $endMonth = \DateTime::createFromFormat('!m', $latestMonth)->format('F');

        // Use the `year` from the request to construct the period covered
        $year = $request->year;

        // Check if there's only one month
        if ($startMonth === $endMonth) {
            $periodCovered = "{$startMonth} {$year}"; // Single month
        } else {
            $periodCovered = "{$startMonth} to {$endMonth} {$year}"; // Range of months
        }

        // Update BlockLotFee entries
        foreach ($fees as $fee) {
            $fee->update([
                'payment_status' => 'Paid',
                'transaction_reference' => $transactionReference,
                'mode_of_payment' => $request->mode_of_payment,
                'transaction_date' => now(),
                'amount_paid' => $fee->fee->amount,
            ]);
        }

        // Create MonthlyPayment entry
        MonthlyPayment::create([
            'user_id' => $user->id,
            'transaction_reference' => $transactionReference,
            'amount' => $request->amount_tendered, // Store the total amount tendered
            'mode_of_payment' => $request->mode_of_payment,
            'transaction_date' => now(),
            'period_covered' => $periodCovered,
            'is_approved' => 1, // Approved status
            'fee_id' => $fees->first()->fee_id, // Use the first fee's ID
            'fee_name' => $fees->first()->fee->name ?? 'N/A', // Use the first fee's name
        ]);
    });

    return response()->json([
        'message' => 'Payment successful',
        'total_amount' => $totalAmount,
        'amount_tendered' => $request->amount_tendered,
    ]);
}



}
