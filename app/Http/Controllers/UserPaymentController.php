<?php

namespace App\Http\Controllers;

use App\Models\{User, UserPayment, ActivatedYear, MonthlyPayment, Setting, Renter,BlockAndLot,Member,BlockLotFee };
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\UserApprovedMail;
use App\Mail\PaymentApproved;
use App\Mail\PaymentRejected;
use App\Mail\AccountHolderUpdatedMail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;


class UserPaymentController extends Controller
{
    public function getActivatedYears() 
    {
        $activated_years = ActivatedYear::where('is_active', 1)->get()->pluck('year');
        return response()->json($activated_years);
    }

    
    public function getPaymentsByYear(User $user, $year)
    {
        if ($user->role == 'Renter') {
            $existingPayments = UserPayment::where('year', $year)
                ->where('block', $user->block)
                ->where('lot', $user->lot)
                ->get();

            $response = collect(range(1, 12))->map(function ($month) use ($existingPayments) {
                $payment = $existingPayments->firstWhere('month', $month);
                return [
                    'month' => $month,
                    'payment_status' => $payment->payment_status ?? 'No Payment',
                    'proof_of_payment' => $payment->proof_of_payment,
                    'transaction_reference' => $payment->transaction_reference,
                ];
            });

            return response()->json($response);
        }

        if($user->is_account_holder == 0) {
            $existingPayments = UserPayment::where('year', $year)
                ->where('block', $user->block)
                ->where('lot', $user->lot)
                ->get();
        } else {
            $existingPayments = $user->userPayments()->where('year', $year)->get();
             // If no payments exist for the selected year, create 12 months with correct payment statuses
            if ($existingPayments->isEmpty()) {
                $months = collect(range(1, 12))->map(function ($month) use ($user, $year) {
                    // Determine if the current month should be Paid or Unpaid
                    $paymentStatus = 'Paid';

                    // Check if the user was created before or during this month in the year
                    if ($user->created_at->year < $year || 
                        ($user->created_at->year == $year && $user->created_at->month <= $month)) {
                        $paymentStatus = 'Unpaid';
                    }

                    return [
                        'user_id' => $user->id,
                        'block' => $user->block,
                        'lot' => $user->lot,
                        'year' => $year,
                        'month' => $month,
                        'payment_status' => $paymentStatus,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                });

                // Insert all months for the selected year
                \DB::table('user_payments')->insert($months->toArray());

                // Retrieve the newly created payments
                $existingPayments = $user->userPayments()->where('year', $year)->get();
            }
        }

       

        // Format months for all 12 months
        $response = collect(range(1, 12))->map(function ($month) use ($existingPayments) {
            $payment = $existingPayments->firstWhere('month', $month);
            return [
                'month' => $month,
                'payment_status' => $payment->payment_status ?? 'No Payment',
                'proof_of_payment' => $payment->proof_of_payment,
                'transaction_reference' => $payment->transaction_reference,
            ];
        });

        return response()->json($response);
    }

    public function getMyTenants(Request $request, User $user)
    {
        // Check if the user owns any blocks and lots
        $ownedBlocksLots = $user->blocksAndLots; // Ensure this relationship exists
        if ($ownedBlocksLots->isEmpty()) {
            return response()->json(['message' => 'No blocks and lots are assigned to this user.'], 400);
        }
    
        // Get the search query and current page
        $search = $request->input('search', '');
        $perPage = 50; // Number of tenants per page
    
        // Build the query for fetching tenants
        $query = User::where('role', 'Renter')
                     ->where(function ($q) {
                         // Ensure proper filtering of is_account_holder
                         $q->where('is_account_holder', '!=', 2)
                           ->orWhereNull('is_account_holder'); // Handle null values if applicable
                     })
                     ->where(function ($q) use ($ownedBlocksLots) {
                         $q->where(function ($subQuery) use ($ownedBlocksLots) {
                             foreach ($ownedBlocksLots as $blockLot) {
                                 $subQuery->orWhere(function ($nestedQuery) use ($blockLot) {
                                     $nestedQuery->where('block', $blockLot->block)
                                                 ->where('lot', $blockLot->lot);
                                 });
                             }
                         });
                     });
    
        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('firstName', 'like', "%{$search}%")
                  ->orWhere('middleName', 'like', "%{$search}%")
                  ->orWhere('lastName', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('contact_number', 'like', "%{$search}%");
            });
        }
    
        // Log the raw SQL query and bindings for debugging
        \Log::info('Tenants Query SQL:', ['query' => $query->toSql(), 'bindings' => $query->getBindings()]);
    
        // Paginate the results
        $tenants = $query->paginate($perPage);
    
        // Return the tenants list as JSON response
        return response()->json($tenants);
    }
    
    
    


    public function getMyMember(Request $request, User $user)
    {
       // Check if the user is a Renter or Homeowner
        if ($user->role === 'Homeowner') {
            // If Homeowner, get all owned blocks and lots
            $ownedBlocksLots = $user->blocksAndLots; // Assume this relationship exists
            if ($ownedBlocksLots->isEmpty()) {
                return response()->json(['message' => 'No blocks and lots are assigned to this user.'], 400);
            }
        } elseif ($user->role === 'Renter') {
            // If Renter, ensure block and lot are assigned
            if (!$user->block || !$user->lot) {
                return response()->json(['message' => 'No blocks and lots are assigned to this user'], 400);
            }

            $ownedBlocksLots = collect([
                (object) ['block' => $user->block, 'lot' => $user->lot]
            ]);
        } else {
            return response()->json(['message' => 'Unauthorized role.'], 403);
        }

        // Get the search query and current page
        $search = $request->input('search', '');
        $perPage = 50; // Number of tenants per page
    
        // Build the query for fetching tenants
        $query = User::where('role', 'Renter')
            ->where(function ($q) use ($ownedBlocksLots) {
                foreach ($ownedBlocksLots as $blockLot) {
                    $q->orWhere(function ($subQuery) use ($blockLot) {
                        $subQuery->where('block', $blockLot->block)
                                 ->where('lot', $blockLot->lot);
                    });
                }
            });
    
        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('firstName', 'like', "%{$search}%")
                  ->orWhere('middleName', 'like', "%{$search}%")
                  ->orWhere('lastName', 'like', "%{$search}%");
            });
        }
    
        // Paginate the results
        $tenants = $query->paginate($perPage);
    
        // Log the query and results for debugging (optional, disable in production)
        \Log::info('Tenants Query: ' . $query->toSql(), $query->getBindings());
    
        return response()->json($tenants);
    }
    
    
    
    public function addNewTenant(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'firstName' => 'required|string|max:255',
                'middleName' => 'nullable|string|max:255',
                'lastName' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email',
                'block' => 'required|string|exists:block_and_lots,block',
                'lot' => 'required|string|exists:block_and_lots,lot',
                'birthdate' => 'required|date_format:Y-m-d',
                'nameOfOwner' => 'required|string|max:255',
                'contactNumber' => 'required|string|max:15',
                'username' => 'required|string|max:255|unique:users,username',
                'family_id' => 'required|integer',
                'gender' => 'required|string|in:Male,Female',
            ]);
    
            // Ensure homeowner exists
            $homeowner = User::whereRaw("CONCAT(firstName, ' ', lastName) = ?", [$validated['nameOfOwner']])
                ->where('is_account_holder', 1)
                ->first();
    
            if (!$homeowner) {
                return response()->json(['message' => 'Homeowner not found. Please ensure the name is correct.'], 404);
            }
    
            // Ensure block and lot belong to the homeowner
            $blockLot = BlockAndLot::where('block', $validated['block'])
                ->where('lot', $validated['lot'])
                ->where('user_id', $homeowner->id)
                ->first();
    
            if (!$blockLot) {
                return response()->json(['message' => 'The specified block and lot do not belong to the homeowner.'], 400);
            }
    
            // Generate a unique account number
            $accountNumberPrefix = 'ACC-' . now()->year . "-{$validated['block']}-{$validated['lot']}";
            $existingCount = User::where('account_number', 'like', "$accountNumberPrefix%")->count();
            $accountNumber = $accountNumberPrefix . '-' . str_pad($existingCount + 1, 4, '0', STR_PAD_LEFT);
    
            // Generate the default password
            $defaultPassword = "Blk{$validated['block']}Lot{$validated['lot']}-" . Str::random(6);
    
            // Create the tenant user
            $user = User::create([
                'firstName' => $validated['firstName'],
                'middleName' => $validated['middleName'],
                'lastName' => $validated['lastName'],
                'email' => $validated['email'],
                'block_lot_id' => $blockLot->id,
                'block' => $blockLot->block,
                'lot' => $blockLot->lot,
                'birthdate' => $validated['birthdate'],
                'nameOfOwner' => $validated['nameOfOwner'],
                'contact_number' => $validated['contactNumber'],
                'username' => strtolower($validated['username']),
                'family_id' => $validated['family_id'],
                'gender' => $validated['gender'],
                'role' => 'Renter',
                'account_number' => $accountNumber,
                'password' => bcrypt($defaultPassword),
            ]);
    
            // Set as account holder if no other account holder exists
            $currentHolder = User::where('block', $user->block)
                ->where('lot', $user->lot)
                ->where('is_account_holder', 1)
                ->where('role', 'Renter')
                ->first();
    
            if (!$currentHolder) {
                $user->is_account_holder = 1;
                $user->save();
            }
    
            // Update the block and lot status
            $blockLot->update(['status' => 'Occupied']);
    
            // Add to renters table
            Renter::create([
                'user_id' => $user->id,
                'block_lot_id' => $blockLot->id,
                'status' => 'active',
            ]);
    
            try {
                Mail::to($user->email)->send(new UserApprovedMail($user, $defaultPassword));
            } catch (\Exception $e) {
                \Log::error('Failed to send email: ' . $e->getMessage());
            }
    
            return response()->json(['message' => 'Tenant added successfully!'], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error adding tenant: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'An error occurred while adding the tenant.'], 500);
        }
    }
    

    public function addNewMember(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'firstName' => 'required|string|max:255',
                'middleName' => 'nullable|string|max:255',
                'lastName' => 'required|string|max:255',
                'email' => 'nullable|email|max:255|unique:users,email',
                'block' => 'required|string|exists:block_and_lots,block',
                'lot' => 'required|string|exists:block_and_lots,lot',
                'birthdate' => 'required|date_format:Y-m-d',
                'contactNumber' => 'required|string|max:15',
                'nameOfOwner' => 'required|string|max:255',
                'username' => 'required|string|max:255|unique:users,username',
                'family_id' => 'required|integer|exists:families,id',
                'gender' => 'required|string|in:Male,Female',
                'role' => 'required|string|in:Homeowner,Renter', // Explicitly require the user's role
            ]);
    
            // Logic for Homeowner
            if ($validated['role'] === 'Homeowner') {
                // Ensure block and lot belong to the homeowner
                $blockLot = BlockAndLot::where('block', $validated['block'])
                    ->where('lot', $validated['lot'])
                    ->first();
    
                if (!$blockLot) {
                    return response()->json(['message' => 'The specified block and lot do not belong to you.'], 400);
                }
            } 
            // Logic for Renter
            elseif ($validated['role'] === 'Renter') {
                // Ensure the block and lot match the renter's assigned block and lot
                $blockLot = BlockAndLot::where('block', $validated['block'])
                    ->where('lot', $validated['lot'])
                    ->first();
    
                if (!$blockLot) {
                    return response()->json(['message' => 'The specified block and lot are invalid.'], 400);
                }
            } else {
                return response()->json(['message' => 'Unauthorized role.'], 403);
            }
    
            // Create the member
            $member = User::create([
                'firstName' => $validated['firstName'],
                'middleName' => $validated['middleName'],
                'lastName' => $validated['lastName'],
                'email' => $validated['email'],
                'block_lot_id' => $blockLot->id,
                'block' => $blockLot->block,
                'lot' => $blockLot->lot,
                'birthdate' => $validated['birthdate'],
                'contact_number' => $validated['contactNumber'],
                'username' => strtolower($validated['username']),
                'family_id' => $validated['family_id'],
                'nameOfOwner' => $validated['nameOfOwner'],
                'gender' => $validated['gender'],
                'role' => 'Renter', // Default role for added members
                'is_account_holder' => 2, // Non-account holder
            ]);
    
            // Mark the block and lot as occupied if not already
            $blockLot->update(['status' => 'Occupied']);
    
            return response()->json(['message' => 'Member added successfully!', 'data' => $member], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error adding member: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'An error occurred while adding the member.'], 500);
        }
    }
    
    
    
    
    
public function destroy($id)
{
    try {
        $member = User::findOrFail($id); // Find the member by ID
        $member->delete(); // Delete the member

        return response()->json([
            'message' => 'Member deleted successfully!',
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Failed to delete member.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

public function updateMember(Request $request, $id)
{
    try {
        // Validate the request
        $validated = $request->validate([
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $id,
            'block' => 'required|string|exists:block_and_lots,block',
            'lot' => 'required|string|exists:block_and_lots,lot',
            'birthdate' => 'required|date_format:Y-m-d',
            'contactNumber' => 'required|string|max:15',
            'gender' => 'required|string|in:Male,Female',
        ]);

        // Retrieve the member
        $member = User::findOrFail($id);

        // Ensure block and lot belong to the homeowner if provided
        if (isset($validated['block'], $validated['lot'])) {
            $blockLot = BlockAndLot::where('block', $validated['block'])
                ->where('lot', $validated['lot'])
                ->first();

            if (!$blockLot) {
                return response()->json(['message' => 'The specified block and lot do not exist or are invalid.'], 400);
            }

            // Assign block and lot to the member
            $member->block = $validated['block'];
            $member->lot = $validated['lot'];
        }

        // Update the member details
        $member->update([
            'firstName' => $validated['firstName'],
            'middleName' => $validated['middleName'],
            'lastName' => $validated['lastName'],
            'email' => $validated['email'],
            'block' => $validated['block'],
            'lot' => $validated['lot'],
            'birthdate' => $validated['birthdate'],
            'contact_number' => $validated['contactNumber'],
            'gender' => $validated['gender'],
        ]);

        return response()->json(['message' => 'Member updated successfully!', 'data' => $member], 200);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
    } catch (\Exception $e) {
        \Log::error('Error updating member: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
        return response()->json(['error' => 'An error occurred while updating the member.'], 500);
    }
}




public function updateTenant(Request $request, User $user)
{
    try {
        $validated = $request->validate([
            'firstName' => 'nullable|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
            'contactNumber' => 'nullable|string|max:15',
            'gender' => 'nullable|string|in:Male,Female',
            'block' => 'nullable|string|exists:block_and_lots,block',
            'lot' => 'nullable|string|exists:block_and_lots,lot',
            'birthdate' => 'nullable|date_format:Y-m-d',
        ]);

        // Ensure block and lot belong to the homeowner if provided
        if (isset($validated['block'], $validated['lot'])) {
            $blockLot = BlockAndLot::where('block', $validated['block'])
                ->where('lot', $validated['lot'])
                ->first();

            if (!$blockLot) {
                return response()->json(['message' => 'The specified block and lot do not exist or are invalid.'], 400);
            }

            $user->block = $validated['block'];
            $user->lot = $validated['lot'];
        }

        $user->update([
            'firstName' => $validated['firstName'] ?? $user->firstName,
            'middleName' => $validated['middleName'] ?? $user->middleName,
            'lastName' => $validated['lastName'] ?? $user->lastName,
            'email' => $validated['email'] ?? $user->email,
            'contact_number' => $validated['contactNumber'] ?? $user->contact_number,
            'gender' => $validated['gender'] ?? $user->gender,
            'birthdate' => $validated['birthdate'] ?? $user->birthdate,
        ]);

        return response()->json(['message' => 'Tenant updated successfully']);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json(['message' => 'Validation failed', 'details' => $e->errors()], 422);
    } catch (\Exception $e) {
        \Log::error('Error updating tenant: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to update tenant. Please try again later.'], 500);
    }
}


    
    public function updateAccountHolder(User $user)
    {
             // Check if the user's `is_account_holder` value is 2
        if ($user->is_account_holder == 2) {
            return response()->json([
                'message' => 'This user cannot be updated as an account holder.',
            ], 403); // Forbidden response
        }
        // Find the current account holder for the same block and lot
        $currentHolder = User::where('block', $user->block)
                            ->where('lot', $user->lot)
                            ->where('is_account_holder', 1)
                            ->where('role', 'Renter')
                            ->first();
        
        // Update the current holder to no longer be the account holder
        if ($currentHolder) {
            $currentHolder->is_account_holder = 0;
            $currentHolder->save();
        }
        
        // Set the new user as the account holder
        $user->is_account_holder = 1;
        $user->save();
    
        // Send email notification to the new account holder
        Mail::to($user->email)->send(new \App\Mail\AccountHolderUpdatedMail($user));
    
        return response()->json(['message' => 'Tenant account holder updated and email sent'], 201);
    }

    public function deleteTenant(Request $request, User $user)
    {
        // Check if the user exists
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Attempt to delete the user
        try {
            $user->delete();  // Delete the user record

            return response()->json(['message' => 'User deleted successfully.']);
        } catch (\Exception $e) {
            // Log the error and return a failure message
            \Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete user. Please try again later.'], 500);
        }
    }

    public function addPayment(Request $request, User $user) {
        $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'proof_of_payment' => 'required|image|mimes:jpeg,png,jpg|max:2048', // Validate image
        ]);


        $block = $user->block;
        $lot = $user->lot;

        $user = User::where('role', 'Homeowner')
                ->where('block', $block)
                ->where('lot', $lot)
                ->where('is_account_holder', 1)
                ->first();
    
        $setting = Setting::where('id', 1)->first();
        $monthlyPayment = $setting->monthly_payment ?? 0;
    
        $year = $request->year;
        $month = $request->month;
        $transaction_reference = Str::uuid();
    
        $unpaidMonths = $user->userPayments()
            ->where('year', $year)
            ->whereBetween('month', [1, $month])
            ->where('payment_status', '!=', 'Paid')
            ->pluck('month');
    
        if ($unpaidMonths->isEmpty()) {
            return response()->json(['message' => 'No unpaid months to process.'], 400);
        }
    
        // Store the proof of payment
        $proofPath = $request->file('proof_of_payment')->store('proof_of_payments', 'public');
    
        foreach ($unpaidMonths as $unpaidMonth) {
            UserPayment::updateOrCreate(
                ['user_id' => $user->id, 'year' => $year, 'month' => $unpaidMonth],
                ['payment_status' => 'Processing', 'proof_of_payment' => $proofPath, 'transaction_reference' => $transaction_reference]
            );
        }

         // Determine the period covered (e.g., Jan-March)
        $monthsCovered = $unpaidMonths->sort()->map(function ($month) {
            return \DateTime::createFromFormat('!m', $month)->format('F');
        })->toArray();
        $periodCovered = $monthsCovered[0] . '-' . end($monthsCovered). ' ' . $year;

        $total_amount = count($unpaidMonths) * $monthlyPayment;

        // Save the record to MonthlyPayment
        MonthlyPayment::create([
            'user_id' => $user->id,
            'transaction_reference' => $transaction_reference,
            'period_covered' => $periodCovered,
            'amount' => $total_amount,
            'proof_of_payment' => $proofPath
        ]);
    
        return response()->json([
            'message' => 'Payment submitted successfully. Pending approval.',
            'total_amount' => $total_amount,
            'months_covered' => $unpaidMonths,
        ]);
    }
    
    public function getRejectedPayments(Request $request)
    {
        // Get search term (optional, can be provided in the query params)
        $search = $request->query('search');
        $perPage = $request->query('perPage', 10); // Default to 10 rows per page
        

        $rejectedPayments = MonthlyPayment::
            when($search, function ($query, $search) {
                // Apply search to 'transaction_reference' or user 'firstName' or 'lastName'
                $query->where('is_approved', 0)
                    ->whereNotNull('reject_reason')
                    ->where('transaction_reference', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('firstName', 'like', "%{$search}%")
                            ->orWhere('lastName', 'like', "%{$search}%");
                    });
            })
            ->where('is_approved', 0)
            ->whereNotNull('reject_reason')
            ->with('user') // Eager load the related 'user' model
            ->orderBy('created_at', 'desc')// Eager load the related 'user' model
            ->paginate($perPage); // Dynamically handle rows per page

        return response()->json($rejectedPayments);
    }

    public function getPendingPayments(Request $request)
    {
        // Get search term (optional, can be provided in the query params)
        $search = $request->query('search');
        $perPage = $request->query('perPage', 10);

        $pendingPayments = MonthlyPayment::
            when($search, function ($query, $search) {
                $query->where('is_approved', 0)
                    ->whereNull('reject_reason')
                    ->where('transaction_reference', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('firstName', 'like', "%{$search}%")
                            ->orWhere('lastName', 'like', "%{$search}%");
                    });
            })
            ->where('is_approved', 0)
            ->whereNull('reject_reason') // Only pending payments, no reject reason
            ->with('user') 
            ->orderBy('created_at', 'desc')// Eager load the related 'user' model
            ->paginate($perPage);

        return response()->json($pendingPayments);
    }

    public function getApprovedPayments(Request $request)
{
    // Get search term and perPage (optional, can be provided in the query params)
    $search = $request->query('search');
    $perPage = $request->query('perPage', 10); // Default to 10 rows per page

    $approvedPayments = MonthlyPayment::query()
        ->where('is_approved', 1) // Only approved payments
        ->when($search, function ($query, $search) {
            $query->where('transaction_reference', 'like', "%{$search}%")
                ->orWhereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('firstName', 'like', "%{$search}%")
                        ->orWhere('lastName', 'like', "%{$search}%");
                });
        })
        ->with('user')
        ->orderBy('created_at', 'desc')// Eager load the related 'user' model
        ->paginate($perPage); // Dynamically handle rows per page

    return response()->json($approvedPayments);
}


    public function getDelayedPayments(Request $request)
    {
        $search = $request->input('search', null);

        $delayedPayments = BlockLotFee::getDelayedPayments($search);

        return response()->json($delayedPayments);
    }


    public function approvePayment(Request $request)
    {
        // Validate the transaction reference in the request
        $request->validate([
            'transaction_reference' => 'required|string|exists:monthly_payments,transaction_reference',
        ]);
    
        try {
            // Wrap the entire operation in a transaction for atomicity
            DB::transaction(function () use ($request) {
                // Fetch MonthlyPayment and approve it
                $monthlyPayment = MonthlyPayment::where('transaction_reference', $request->transaction_reference)
                    ->firstOrFail();
    
                $monthlyPayment->update([
                    'is_approved' => 1, // Approved status
                    'updated_at' => now(),
                ]);
    
                // Update related BlockLotFee records
                BlockLotFee::where('transaction_reference', $request->transaction_reference)
                    ->update([
                        'payment_status' => 'Paid',
                        'updated_at' => now(),
                    ]);
            });
    
            // Fetch user for email notification
            $monthlyPayment = MonthlyPayment::where('transaction_reference', $request->transaction_reference)->first();
            $user = $monthlyPayment->user;
    
            if ($user) {
                // Prepare email details
                $transactionDate = \Carbon\Carbon::parse($monthlyPayment->transaction_date)->format('F d, Y');

                Mail::to($user->email)->send(new PaymentApproved(
                    $user,
                    $request->transaction_reference,
                    $monthlyPayment->amount,
                    $monthlyPayment->period_covered,
                    $transactionDate
                ));
            } else {
                \Log::warning('User not found for transaction reference.', [
                    'transaction_reference' => $request->transaction_reference,
                ]);
            }
    
            // Respond with success
            return response()->json(['message' => 'Payment approved successfully and email notification sent.'], 200);
        } catch (\Exception $e) {
            \Log::error('Payment Approval Failed:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Payment approval failed.', 'error' => $e->getMessage()], 500);
        }
    }
    
    
    public function rejectPayment(Request $request)
    {
        // Validate the transaction reference and reject reason
        $request->validate([
            'transaction_reference' => 'required|string|exists:monthly_payments,transaction_reference',
            'reject_reason' => 'required|string',
        ]);
    
        try {
            // Find the MonthlyPayment based on the transaction reference
            $monthlyPayment = MonthlyPayment::where('transaction_reference', $request->transaction_reference)->first();
    
            // If no MonthlyPayment is found, return an error
            if (!$monthlyPayment) {
                return response()->json(['message' => 'Monthly payment not found.'], 404);
            }
    
            // Update the rejection details
            $monthlyPayment->is_approved = 0; // Mark as not approved
            $monthlyPayment->reject_reason = $request->reject_reason; // Add rejection reason
            $monthlyPayment->updated_at = now();
            $monthlyPayment->save();
    
            // Find the BlockLotFee records based on the transaction reference
            $payments = BlockLotFee::where('transaction_reference', $request->transaction_reference)->get();
    
            // If there are payments found
            if ($payments->isNotEmpty()) {
                foreach ($payments as $payment) {
                    // Update the payment_status to 'Rejected'
                    $payment->payment_status = 'Unpaid';
                    $payment->updated_at = now();
                    $payment->save();
                }
            } else {
                return response()->json(['message' => 'No related BlockLotFee found.'], 404);
            }
    
            // Send email notification to the user
            $user = $monthlyPayment->user; // Assuming MonthlyPayment has a relation to User
    
            if ($user) {
                Mail::to($user->email)->send(new PaymentRejected($user, $request->transaction_reference, $request->reject_reason));
            }
    
            return response()->json(['message' => 'Payment rejected successfully, and email notification sent.'], 200);
        } catch (\Exception $e) {
            \Log::error('Payment rejection error: ' . $e->getMessage());
    
            return response()->json([
                'message' => 'An error occurred while rejecting the payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    

    public function updateSpamNotifications(Request $request)
    {
        $validated = $request->validate([
            'enable_spam_notifications' => 'required|boolean',
        ]);

        // Assuming there is only one setting record, or you're targeting a specific setting
        $setting = Setting::first(); // If there are multiple, you'd target one specifically

        // Update the field
        $setting->enable_spam_notifications = $validated['enable_spam_notifications'];
        $setting->save();

        return response()->json([
            'message' => 'Spam notification setting updated successfully.',
            'enable_spam_notifications' => $setting->enable_spam_notifications
        ]);
    }

    public function getSpamNotifications()
    {
        $setting = Setting::first(); 
    
        return response()->json([
            'enable_spam_notifications' => $setting->enable_spam_notifications,
        ]);
    }

    public function getMonthlyPaymentAmount()
    {
        $setting = Setting::first(); 
    
        return response()->json(['monthly_payment' => $setting->monthly_payment, 'account_number' => $setting->account_number]);
    }

    public function updateSettings(Request $request)
    {
        $setting = Setting::first(); 
        $setting->account_number = $request->account_number;
        $setting->save();
        return response()->json(['message' => 'Settings updated']);
    }

    public function getSettings()
{
    $setting = Setting::first();

    if (!$setting) {
        return response()->json([
            'message' => 'Settings not found',
            'account_number' => null
        ], 404);
    }

    return response()->json([
        'account_number' => $setting->account_number
    ], 200);
}



    
    public function getTotalApprovedPayments()
    {
        try {
            // Sum up all the amounts where `is_approved` is 1
            $totalApprovedPayments = MonthlyPayment::where('is_approved', 1)->sum('amount');
    
            // Format the total as a float with two decimal places
            $totalApprovedPayments = number_format((float) $totalApprovedPayments, 2, '.', '');
    
            // Return the total as a JSON response
            return response()->json([
                'success' => true,
                'totalApproved' => $totalApprovedPayments,
            ], 200);
        } catch (\Exception $e) {
            // Handle errors and return a response
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch total approved payments',
            ], 500);
        }
    }
    
    
    public function getPrintApproved()
{
    try {
        $approvedPayments = MonthlyPayment::where('is_approved', 1)
            ->with('user')
            ->get();

        return response()->json($approvedPayments, 200);
    } catch (\Exception $e) {
        \Log::error('Error fetching approved payments:', ['message' => $e->getMessage()]);
        return response()->json([
            'message' => 'Failed to fetch approved payments.',
            'error' => $e->getMessage(),
        ], 500);
    }
}




public function getApprovedPaymentsUser(Request $request)
{
    $userId = $request->query('user_id');

    // Fetch the user details to determine the role and family_id
    $user = User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'User not found.'], 404);
    }

    // Determine query logic based on user role
    $query = MonthlyPayment::where('is_approved', 1)
        ->with(['user', 'fees']);

    if ($user->role === 'Homeowner') {
        // Fetch all payments for the same family_id
        $query->whereHas('user', function ($q) use ($user) {
            $q->where('family_id', $user->family_id);
        });
    } elseif ($user->role === 'Renter') {
        // Fetch only the renter's payments
        $query->where('user_id', $user->id);
    } else {
        return response()->json(['message' => 'Invalid user role.'], 403);
    }

    // Fetch the results with sorting
    $approvedPayments = $query->orderBy('created_at', 'desc')->get();

    return response()->json([
        'message' => 'Payments fetched successfully.',
        'data' => $approvedPayments,
    ]);
}



public function getRejectedPaymentsUser(Request $request)
{
    $userId = $request->query('user_id');

    // Fetch the user details to determine the role and family_id
    $user = User::find($userId);

    if (!$user) {
        return response()->json(['message' => 'User not found.'], 404);
    }

    // Determine query logic based on user role
    $query = MonthlyPayment::where('is_approved', 0) // Only rejected payments
        ->whereNotNull('reject_reason') // Ensure a rejection reason exists
        ->with(['user', 'fees']); // Eager load user and fee details

    if ($user->role === 'Homeowner') {
        // Fetch all rejected payments for the same family_id
        $query->whereHas('user', function ($q) use ($user) {
            $q->where('family_id', $user->family_id);
        });
    } elseif ($user->role === 'Renter') {
        // Fetch only the renter's rejected payments
        $query->where('user_id', $user->id);
    } else {
        return response()->json(['message' => 'Invalid user role.'], 403);
    }

    // Fetch the results with sorting
    $rejectedPayments = $query->orderBy('created_at', 'desc')->get();

    // Return the response
    return response()->json([
        'message' => 'Rejected payments fetched successfully.',
        'data' => $rejectedPayments,
    ]);
}


}
