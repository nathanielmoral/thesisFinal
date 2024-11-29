<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\{User, Resident, BlockAndLot, Family};
use Illuminate\Support\Facades\Log;
use App\Mail\UserApprovedMail;
use Illuminate\Support\Facades\Mail;

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
            // Skip the header row
            if ($index === 0) continue;
    
            try {
                $block = $record[3];
                $lot = $record[4];
    
                // Find or create a User
                $userCount = User::where('block', $block)->where('lot', $lot)->count();
                $user = User::create([
                    'firstName' => $record[0],
                    'middleName' => $record[1] ?? null,
                    'lastName' => $record[2],
                    'block' => $block,
                    'lot' => $lot,
                    'role' => 'Homeowner',
                    'email' => $record[6],
                    'username' => $record[7],
                    'contact_number' => $record[8],
                    'nameOfOwner' => $record[9],
                    'gender' => $record[10],
                    'is_account_holder' => $userCount > 0 ? 0 : 1,
                ]);
    
                $existingFamily = Family::where('block', $block)->where('lot', $lot)->first();
                $existingAccountHolder = User::where('block', $block)
                                            ->where('lot', $lot)
                                            ->where('is_account_holder', 1)
                                            ->first();
    
                if (!$existingFamily) {
                    $familyId = !$existingAccountHolder ? null : $existingAccountHolder->id;
                    Family::create(['block' => $block, 'lot' => $lot, 'account_holder_id' => $familyId]);
                }
    
                $blockLot = BlockAndLot::where('block', $block)->where('lot', $lot)->first();
                if ($blockLot) {
                    $blockLot->status = 'Occupied';
                    $blockLot->user_id = $user->id; // Assign the user_id
                    $blockLot->save();
                } else {
                    BlockAndLot::create([
                        'block' => $block,
                        'lot' => $lot,
                        'status' => 'Occupied',
                        'user_id' => $user->id, // Assign the user_id
                    ]);
                }
    
                if ($user->is_account_holder == 1) {
                    $year = now()->year;
                    $existingPayments = $user->userPayments()->where('year', $year)->get();
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
                    }
                }
    
                $password = 'myaccount123';
                Mail::to($user->email)->send(new UserApprovedMail($user, $password));
                $savedCount++;
            } catch (\Exception $e) {
                Log::error("Failed to save resident record at row $index: " . $e->getMessage());
                $skippedCount++;
            }
        }
    
        return response()->json([
            'message' => $savedCount > 0
                ? "Residents imported successfully. $savedCount records saved. $skippedCount records were missing required fields and were excluded."
                : "No valid records were imported. $skippedCount records were missing required fields.",
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
    
        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }
    
        // Search functionality (grouped conditions)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('block', 'like', "%{$search}%")
                  ->orWhere('lot', 'like', "%{$search}%");
            });
        }
    
        // Pagination with sorting: first by block, then by lot
        $blocks = $query->orderBy('block', 'asc')
                        ->orderBy('lot', 'asc')
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

}
