<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\{User, Resident, BlockAndLot, Family};
use Illuminate\Support\Facades\Log;
use App\Mail\UserApprovedMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\UserBlockLot;
use Illuminate\Support\Str;

class ResidentController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
        ]);
    
        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file->getRealPath());
        $worksheet = $spreadsheet->getActiveSheet();
        $records = $worksheet->toArray();
    
        $savedCount = 0;
        $skippedCount = 0;
    
        foreach ($records as $index => $record) {
            if ($index === 0) continue; // Skip header row
    
            try {
                $block = $record[3] ?? null;
                $lot = $record[4] ?? null;
                $email = $record[6] ?? null;
                $birthdate = isset($record[11]) ? Carbon::parse($record[11]) : null;
                $userCount = User::where('block', $block)->where('lot', $lot)->count();

                $password = "Blk{$block}Lot{$lot}-" . Str::random(6);

                // Generate a unique account number
                $accountNumberPrefix = 'ACC-' . now()->year . "-$block-$lot";
                $existingCount = User::where('account_number', 'like', "$accountNumberPrefix%")->count();
                $accountNumber = $accountNumberPrefix . '-' . str_pad($existingCount + 1, 4, '0', STR_PAD_LEFT);
    
                // Validate required fields
                if (empty($block) || empty($lot) || empty($email)) {
                    Log::warning("Skipped record at row $index: Missing block, lot, or email.");
                    $skippedCount++;
                    continue;
                }
    
                // Find or create the User
                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'firstName' => $record[0],
                        'middleName' => $record[1] ?? null,
                        'lastName' => $record[2],
                        'role' => 'Homeowner',
                        'username' => $record[7],
                        'contact_number' => $record[8],
                        'nameOfOwner' => $record[9],
                        'gender' => $record[10],
                        'birthdate' => $birthdate,
                        'account_number' => $accountNumber,
                        'password' => bcrypt($password),
                        'is_account_holder' => $userCount > 0 ? 0 : 1, 
                    ]
                );
    
                // Associate block and lot to the user in UserBlockLot
                UserBlockLot::firstOrCreate([
                    'user_id' => $user->id,
                    'block' => $block,
                    'lot' => $lot,
                ]);
    
                // Set primary block and lot in the user's table if not set
                if (!$user->block && !$user->lot) {
                    $user->update([
                        'block' => $block,
                        'lot' => $lot,
                    ]);
                }
                
                           // Handle Family record creation
                         // Handle Family record creation
                        $existingFamily = Family::where('block', $block)->where('lot', $lot)->first();
                        if (!$existingFamily) {
                            $existingAccountHolder = UserBlockLot::where('block', $block)
                                ->where('lot', $lot)
                                ->whereHas('user', function ($query) {
                                    $query->where('is_account_holder', 1);
                                })
                                ->first();

                            // Create a new Family record
                            $newFamily = Family::create([
                                'block' => $block,
                                'lot' => $lot,
                                'account_holder_id' => $existingAccountHolder->user_id ?? null,
                            ]);

                            // Update the user's family_id
                            $user->update(['family_id' => $newFamily->id]);
                        } else {
                            // Update the user's family_id to the existing family's ID
                            $user->update(['family_id' => $existingFamily->id]);
                        }

    
                // Associate block and lot with the BlockAndLot table
                BlockAndLot::firstOrCreate(
                    ['block' => $block, 'lot' => $lot],
                    ['user_id' => $user->id, 'status' => 'Occupied']
                );
    
                // Handle payments for the account holder
                if ($user->is_account_holder == 1) {
                    $year = now()->year;
    
                    $months = collect(range(1, 12))->flatMap(function ($month) use ($user, $block, $lot, $year) {
                        $paymentStatus = ($user->created_at->year < $year ||
                            ($user->created_at->year == $year && $user->created_at->month <= $month)) ? 'Unpaid' : 'Paid';
    
                        return [
                            [
                                'user_id' => $user->id,
                                'block' => $block,
                                'lot' => $lot,
                                'year' => $year,
                                'month' => $month,
                                'payment_status' => $paymentStatus,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]
                        ];
                    });
    
                    \DB::table('user_payments')->insert($months->toArray());
                }
    
                if ($user->wasRecentlyCreated) {
                    // Send email to the user
                    $blocksAndLots = UserBlockLot::where('user_id', $user->id)
                        ->get()
                        ->map(function ($blockLot) {
                            return "Block: {$blockLot->block}, Lot: {$blockLot->lot}";
                        })->join("\n");
            
                    Mail::to($user->email)->send(new UserApprovedMail($user, $password, $blocksAndLots));
                    $savedCount++;
                }
            } catch (\Exception $e) {
                Log::error("Failed to process record at row $index: " . $e->getMessage());
                $skippedCount++;
            }
        }
    
        return response()->json([
            'message' => $savedCount > 0
                ? "Residents imported successfully. $savedCount records saved. $skippedCount records skipped."
                : "No valid records were imported. $skippedCount records skipped.",
        ]);
    }
    
    
    public function getResidents()
    {
        try {
            $residents = User::where('role', '!=', 'Administrator')->get(); // or your specific query
            return response()->json($residents);
        } catch (\Exception $e) {
            // Log the error for easier debugging
            \Log::error("Error fetching residents: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch residents'], 500);
        }
    }
    public function getBlockAndLot(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
    
        $query = BlockAndLot::query();
    
        // Join with the Users table to get user details
        $query->leftJoin('users', 'block_and_lots.user_id', '=', 'users.id')
              ->select(
                  'block_and_lots.*', 
                  'users.firstName', 
                  'users.lastName', 
                  'users.middleName', 
              ); // Add user details to the selection
    
        // Filter by status
        if ($status) {
            $query->where('block_and_lots.status', $status);
        }
    
        // Search functionality (grouped conditions)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('block_and_lots.block', 'like', "%{$search}%")
                  ->orWhere('block_and_lots.lot', 'like', "%{$search}%")
                  ->orWhere('users.firstName', 'like', "%{$search}%")
                  ->orWhere('users.lastName', 'like', "%{$search}%");
            });
        }
    
        // Pagination with sorting: first by block, then by lot
        $blocks = $query->orderBy('block_and_lots.block', 'asc')
                        ->orderBy('block_and_lots.lot', 'asc')
                        ->paginate(10);
    
        return response()->json($blocks);
    }
    

    public function newBlockLot(Request $request)
    {
        $request->validate([
            'block' => 'required|integer',
        ]);
    
        // Retrieve all lots for the specified block
        $existingLots = BlockAndLot::where('block', $request->block)
            ->orderBy('lot')
            ->pluck('lot')
            ->toArray();
    
        $nextLot = 1; // Start with lot 1 by default
    
        // Find the first missing lot number
        for ($i = 1; $i <= max($existingLots) + 1; $i++) {
            if (!in_array($i, $existingLots)) {
                $nextLot = $i;
                break;
            }
        }
    
        // Create the new block and lot
        $block = BlockAndLot::create([
            'block' => $request->block,
            'lot' => $nextLot,
            'status' => 'Unoccupied',
        ]);
    
        return response()->json($block, 201);
    }
    
    public function updateBlockLot(Request $request, $id)
    {
        $block = BlockAndLot::findOrFail($id);

        $block->update($request->all());

        return response()->json($block);
    }

    public function deleteBlockLot($id)
    {
        // Find the block and lot by its ID
        $block = BlockAndLot::findOrFail($id);
    
        // Check if the block is Unoccupied
        if ($block->status !== 'Unoccupied') {
            return response()->json([
                'error' => 'Only unoccupied blocks can be deleted.'
            ], 403); // 403 Forbidden
        }
    
        // Delete the block
        $block->delete();
    
        return response()->json([
            'message' => 'Block and lot deleted successfully.'
        ], 204);
    }
    
   
    
    public function getBlockOccupancyStatus()
    {
        // Count the number of occupied blocks
        $occupiedCount = BlockAndLot::where('status', 'Occupied')->count();
    
        // Count the number of unoccupied blocks
        $unoccupiedCount = BlockAndLot::where('status', 'Unoccupied')->count();
    
        // Return the result as a JSON response
        return response()->json([
            'occupied' => $occupiedCount,
            'unoccupied' => $unoccupiedCount,
        ]);
    }

    public function getUsersForBlockAndLot($blockId)
{
    $block = BlockAndLot::with('users')->findOrFail($blockId);

    return response()->json([
        'block' => $block->block,
        'lot' => $block->lot,
        'status' => $block->status,
        'users' => $block->users, // This will include all associated users
    ]);
}

public function getOwnedBlocksLots($userId)
{
    // Fetch blocks and lots owned by the user
    $ownedBlocksLots = BlockAndLot::where('user_id', $userId)
        ->select('id', 'block', 'lot', 'status') // Fetch necessary fields
        ->get()
        ->map(function ($blockLot) {
            // Concatenate block and lot into a single string
            $blockLot->blockAndLot = "{$blockLot->block},{$blockLot->lot}";
            return $blockLot;
        });

    // Check if the user owns any blocks/lots
    if ($ownedBlocksLots->isEmpty()) {
        return response()->json(['message' => 'No blocks or lots found for this user.'], 404);
    }

    // Return the owned blocks and lots
    return response()->json([
        'status' => 'success',
        'data' => $ownedBlocksLots,
    ], 200);
}


public function fetchAllBlocksAndLots()
{
    // Fetch all unique blocks and lots
    $blocksAndLots = UserBlockLot::distinct()->get(['block', 'lot']);

    return response()->json([
        'data' => $blocksAndLots,
    ]);
}

public function getOccupiedBlockAndLot(Request $request)
{
    $search = $request->input('search');

    $query = BlockAndLot::query();

    // Join with the Users table to get user details
    $query->leftJoin('users', 'block_and_lots.user_id', '=', 'users.id')
          ->select(
              'block_and_lots.*',
              'users.firstName',
              'users.lastName',
              'users.middleName'
          );

    // Filter by status = 'Occupied'
    $query->where('block_and_lots.status', 'Occupied');

    // Search functionality (grouped conditions)
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('block_and_lots.block', 'like', "%{$search}%")
              ->orWhere('block_and_lots.lot', 'like', "%{$search}%")
              ->orWhere('users.firstName', 'like', "%{$search}%")
              ->orWhere('users.lastName', 'like', "%{$search}%");
        });
    }

    // Pagination with sorting: first by block, then by lot
    $blocks = $query->orderBy('block_and_lots.block', 'asc')
                    ->orderBy('block_and_lots.lot', 'asc')
                    ->paginate(10);

    return response()->json($blocks);
}




}
