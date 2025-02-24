<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\BlockAndLot;
use App\Models\Family;
use App\Models\Member;
use App\Models\UserPayment;
use App\Models\MonthlyPayment;
use App\Mail\UserApprovedMail;
use App\Mail\UserRejectedMail;
use App\Mail\UserDeletedNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;



class UserController extends Controller
{
    // List pending users
    public function index()
    {
        try {
            $users = User::where('status', 'pending')->orderBy('created_at', 'desc')->get();
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error retrieving users: ' . $e->getMessage(), [
                'exception' => $e,
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);
            return response()->json(['error' => 'Failed to retrieve users'], 500);
        }
    }

// List approved users
public function approvedUsers(Request $request)
{
    try {
        // Get the search query from the request
        $search = $request->input('search');

        // Fetch and filter users
        $users = $this->fetchFilteredApprovedUsers($search);

        // Group users by block and lot
        $families = $this->groupUsersByBlockAndLot($users);

        // Assign Family ID and Account Holder
        $this->assignFamilyIdsAndAccountHolders($families);

        // Return the list of approved users with their family information
        return response()->json($users);
    } catch (\Exception $e) {
        Log::error('Error retrieving approved users: ' . $e->getMessage(), ['exception' => $e]);
        return response()->json(['error' => 'Failed to retrieve approved users'], 500);
    }
}

private function fetchFilteredApprovedUsers($search)
{
    // Query for members
    $membersQuery = Member::query();

    if ($search) {
        $membersQuery->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('middle_name', 'like', "%{$search}%");
        });
    }

    // Include the related homeowner (user) for members
    $members = $membersQuery->with('homeowner')->get();

    // Query for users
    $usersQuery = User::query()->where('role', '!=', 'Administrator');

    if ($search) {
        $usersQuery->where(function ($q) use ($search) {
            // Replace `name` with the concatenation of `first_name` and `last_name`
            $q->where(DB::raw("CONCAT(firstName, ' ', lastName)"), 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // Fetch users
    $users = $usersQuery->get();

    // Combine the results from both queries
    $combined = $members->merge($users);

    // Sort the combined results by creation date (if applicable)
    return $combined->sortByDesc(function ($item) {
        return $item->created_at ?? now(); // Ensure created_at exists or fallback to current date
    })->values();
}



// Function to group users by block and lot
private function groupUsersByBlockAndLot($users)
{
    $users = User::with('blocksAndLots')->get(); // Ensure relationship is loaded

    return $users->flatMap(function ($user) {
        return $user->blocksAndLots->map(function ($blockAndLot) use ($user) {
            if ($blockAndLot->pivot) { // Check if pivot data exists
                return [
                    'block-lot' => $blockAndLot->pivot->block . '-' . $blockAndLot->pivot->lot,
                    'user' => $user
                ];
            }
            return null; // Skip if no pivot data
        })->filter(); // Remove null entries
    })->groupBy('block-lot');
}

// Function to assign Family ID and Account Holder
private function assignFamilyIdsAndAccountHolders($families)
{
    foreach ($families as $key => $family) {
        $block = explode('-', $key)[0];
        $lot = explode('-', $key)[1];
        $familyId = null;

        // Check if a family record exists for this block and lot
        $existingFamily = Family::where('block', $block)->where('lot', $lot)->first();

        if ($existingFamily) {
            // Use the existing family ID
            $familyId = $existingFamily->id;
        } else {
            // Create a new family record and get the new family ID
            $newFamily = Family::create(['block' => $block, 'lot' => $lot]);
            $familyId = $newFamily->id;
        }

        // Assign the family_id to each user in the family
        foreach ($family as $user) {
            if (!$user->family_id) {
                $user->family_id = $familyId;
                $user->save();
            }
        }

        // Assign Account Holder logic
        if ($family->count() === 1) {
            // If there is only one user, make them the Account Holder
            $user = $family->first();
            $user->is_account_holder = 1;
            $user->save();

            // Update the account_holder_id in the families table
            Family::where('id', $familyId)->update(['account_holder_id' => $user->id]);
        } else {
            // If there are multiple users, ensure there is an Account Holder
            $accountHolderAssigned = false;
            foreach ($family as $user) {
                if ($user->is_account_holder) {
                    $accountHolderAssigned = true;
                    break;
                }
            }

            // If no Account Holder is assigned, assign the first user as Account Holder
            if (!$accountHolderAssigned) {
                $firstUser = $family->first();
                $firstUser->is_account_holder = 1;
                $firstUser->save();

                // Update the account_holder_id in the families table
                Family::where('id', $familyId)->update(['account_holder_id' => $firstUser->id]);
            }
        }
    }
}  

    // Approve user
    public function approve($userId)
    {
        Log::info('Approve method called', ['userId' => $userId]); // Log the method call
        try {
            $user = User::findOrFail($userId);
            $password = Str::random(10); // Generate random password
            $user->status = 'approved';
            $user->password = bcrypt($password); // Save the password
            $user->is_first_login = true; 
            $user->save();

            // Send approval email with password
            Mail::to($user->email)->send(new UserApprovedMail($user, $password));

            Log::info('User approved successfully', ['userId' => $userId]); // Log successful approval
            return response()->json(['message' => 'User approved successfully']);
        } catch (\Exception $e) {
            Log::error('Error approving user: ' . $e->getMessage(), ['userId' => $userId, 'exception' => $e]);
            return response()->json(['error' => 'Failed to approve user'], 500);
        }
    }

    // Reject a user
    public function reject(Request $request, $userId)
    {
        Log::info('Reject method called', ['userId' => $userId]); // Log the method call

        try {
            $user = User::findOrFail($userId);

            // Send rejection email before deleting
            Mail::to($user->email)->send(new UserRejectedMail($user));

            // Delete the user
            $user->delete();

            Log::info('User rejected successfully', ['userId' => $userId]); // Log successful rejection
            return response()->json(['message' => 'User rejected and deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error rejecting user: ' . $e->getMessage(), ['exception' => $e, 'userId' => $userId]);
            return response()->json(['error' => 'Failed to reject user'], 500);
        }
    }

    // Add a new user
    public function store(Request $request)
    {
        $validated = $request->validate([
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'contact_number' => 'required|string|max:255',
            'gender' => 'required|string|max:255',
            'block' => 'required|string|max:255',
            'lot' => 'required|string|max:255',
            'role' => 'required|string|in:Homeowner,Renter',
            'proofOfResidency' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);
    
        try {
            // Handle file upload
            $file = $request->file('proofOfResidency');
            $filePath = $file->store('proofs', 'public');
    
            // Generate a default username
            $defaultUsername = strtolower($request->firstName . '.' . $request->lastName . rand(1000, 9999));
    
            // Create the user
            $user = User::create([
                'firstName' => $request->firstName,
                'middleName' => $request->middleName,
                'lastName' => $request->lastName,
                'email' => $request->email,
                'contact_number' => $request->contact_number,
                'gender' => $request->gender,
                'block' => $request->block,
                'lot' => $request->lot,
                'proofOfResidency' => $filePath,
                'role' => $request->role,
                'status' => 'pending', // Set status to pending by default
                'username' => $defaultUsername, // Add default username
            ]);
    
            // Assign the family_id based on block and lot
            $this->assignFamilyIdToUser($user);
    
            return response()->json($user, 201);
        } catch (\Exception $e) {
            Log::error('Error adding user: ' . $e->getMessage(), ['exception' => $e, 'requestData' => $request->all()]);
            return response()->json(['error' => 'Failed to add user. Please try again later.'], 500);
        }
    }
    

    public function update(Request $request, $userId)
    {
        // Validate the input fields
        $validated = $request->validate([
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $userId,
            'role' => 'required|string|max:255',
            'userType' => 'required|string', // Validate userType as string
            'password' => 'nullable|string|min:8',
            'contact_number' => 'required|string|max:15', // Validate Mobile Number
            'block' => 'nullable|string|max:10', // Validate Block
            'lot' => 'nullable|string|max:10', // Validate Lot
            'gender' => 'nullable|string|max:10', // Validate Gender
            'birthdate' => 'nullable|date', // Validate Birthdate for Age calculation
        ]);
    
        try {
            // Find the user by ID
            $user = User::findOrFail($userId);
    
            // Update the fields
            $user->firstName = $request->input('firstName');
            $user->middleName = $request->input('middleName');
            $user->lastName = $request->input('lastName');
            $user->email = $request->input('email');
            $user->role = $request->input('role');
            $user->userType = strtolower($request->input('userType')); // Ensure userType is lowercase
            $user->contact_number = $request->input('contact_number'); // Update Mobile Number
            $user->block = $request->input('block'); // Update Block
            $user->lot = $request->input('lot'); // Update Lot
            $user->gender = $request->input('gender'); // Update Gender
    
            // If birthdate is provided, update it for age calculation
            if ($request->has('birthdate')) {
                $user->birthdate = $request->input('birthdate');
            }
    
            // Update password if provided
            if ($request->input('password')) {
                $user->password = bcrypt($request->input('password'));
            }
    
            // Save the updated user details
            $user->save();
    
            // Return the updated user data as response
            return response()->json($user);
        } catch (\Exception $e) {
            // Log error and return a response in case of failure
            Log::error('Error updating user: ' . $e->getMessage(), ['exception' => $e, 'userId' => $userId]);
            return response()->json(['error' => 'Failed to update user'], 500);
        }
    }
    


    public function delete($userId)
    {
        try {
            // Find the user
            $user = User::findOrFail($userId);
    
            // Get all blocks and lots associated with the user
            $blockAndLots = $user->blockAndLots;
            $userBlock = $user->block;
            $userLot = $user->lot;
            $family = \App\Models\Family::where('block', $userBlock)->where('lot', $userLot)->first();
    
            $remainingFamilyMembers = User::where('family_id', $user->family_id)
                ->where('id', '!=', $user->id) // Exclude ang dine-delete na user
                ->get();
    
            $userBlockLot = BlockAndLot::where('block', $userBlock)
                                        ->where('lot', $userLot)
                                        ->first();
    
            if ($remainingFamilyMembers->isNotEmpty()) {
                $otherFamilyMember = $remainingFamilyMembers->first();
    
                if ($userBlockLot) {
                    $userBlockLot->user_id = $otherFamilyMember->id;
                    $userBlockLot->save();
                }
    
                if ($user->is_account_holder == 1) {
                    $otherFamilyMember->is_account_holder = 1;
                    $otherFamilyMember->save();
    
                    $userPayments = UserPayment::where('user_id', $user->id)->get();
                    if ($userPayments) {
                        foreach ($userPayments as $userPayment) {
                            $userPayment->user_id = $otherFamilyMember->id;
                            $userPayment->save();
                        }
                    }
    
                    $monthlyPayments = MonthlyPayment::where('user_id', $user->id)->get();
                    if ($monthlyPayments) {
                        foreach ($monthlyPayments as $monthlyPayment) {
                            $monthlyPayment->user_id = $otherFamilyMember->id;
                            $monthlyPayment->save();
                        }
                    }
    
                    if ($family) {
                        $family->account_holder_id = $otherFamilyMember->id;
                        $family->save();
                    }
                }
            } else {
                if ($family) {
                    $family->delete();
                }
    
                if ($userBlockLot) {
                    $userBlockLot->user_id = null;
                    $userBlockLot->status = 'Unoccupied';
                    $userBlockLot->save();
                }
            }
    
            // Send email notification only if the user has an email
            if ($user->email) {
                try {
                    Mail::to($user->email)->send(new \App\Mail\UserDeletedNotification($user));
                } catch (\Exception $e) {
                    // Log any email sending errors
                    Log::error('Error sending email to user: ' . $e->getMessage());
                }
            }
    
            // Delete the user
            $user->delete();
    
            return response()->json([
                'message' => 'User deleted successfully. Associated blocks updated, and email notification sent if applicable.',
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error deleting user: ' . $e->getMessage(), ['exception' => $e, 'userId' => $userId]);
    
            return response()->json(['error' => 'Failed to delete user'], 500);
        }
    }
    
    
    
    // Update profile picture
    public function uploadAvatar(Request $request, $userId) 
    {
        // Validate the uploaded file
        $request->validate([
            'avatar' => 'required|file|mimes:jpg,jpeg,png|max:2048',
        ]);
    
        try {
            // Find the user by their ID
            $user = User::findOrFail($userId);
    
            // Handle file upload
            if ($request->hasFile('avatar')) {
                $file = $request->file('avatar');
                
                // Get the original file name
                $originalFileName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                
                // Generate a custom file name (e.g., with user ID to avoid conflicts)
                $fileName = $originalFileName . '_' . time() . '.' . $file->getClientOriginalExtension();
    
                // Delete old profile photo if it exists
                if ($user->profile_photo_path) {
                    Storage::disk('public')->delete($user->profile_photo_path);  // Deletes the old avatar
                }
    
                // Store the file with the original name or a custom name
                $path = $file->storeAs('avatars', $fileName, 'public');
    
                // Update user's profile photo path
                $user->profile_photo_path = $path;
                $user->save();
            }
    
            return response()->json(['message' => 'Profile picture uploaded successfully'], 200);
        } catch (\Exception $e) {
            \Log::error('Failed to upload avatar: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to upload avatar'], 500);
        }
    }
    


    // Get approved users count by gender
    public function getApprovedUsersCountByGender()
    {
        try {
            $maleCount = User::where('status', 'approved')->where('gender', 'Male')->count();
            $femaleCount = User::where('status', 'approved')->where('gender', 'Female')->count();


             // Count genders in the members table
             $maleMembers = Member::where('gender', 'Male')->count();
             $femaleMembers = Member::where('gender', 'Female')->count();

              // Combine counts
            $totalMaleCount = $maleCount + $maleMembers;
            $totalFemaleCount = $femaleCount + $femaleMembers;
    
            return response()->json([
                'users' => [
                    'male' => $maleCount,
                    'female' => $femaleCount,
                ],
                'members' => [
                    'male' => $maleMembers,
                    'female' => $femaleMembers,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch approved users count by gender',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

  
    

    private function assignFamilyIdToUser($user)
{
    // Find or create a family based on block and lot
    $family = \App\Models\Family::firstOrCreate([
        'block' => $user->block,
        'lot' => $user->lot,
    ]);

    // Assign the family_id to the user
    $user->family_id = $family->id;
    $user->save();
}

// Update password
        public function updatePassword(Request $request)
        {
        $request->validate([
        'current_password' => 'required',
        'new_password' => 'required|min:8|confirmed',
        ]);

        $user = Auth::user();  // Get the authenticated user

        // Check if the provided current password matches the stored hash
        if (Hash::check($request->current_password, $user->password)) {

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password updated successfully'], 200);
        }

        return response()->json(['error' => 'Current password is incorrect'], 400);
        }

public function getUserProfile(Request $request)
{
    $user = $request->user();

    // Generate the full URL for the profile picture
    $profilePhotoUrl = $user->profile_photo_path 
        ? asset('storage/' . $user->profile_photo_path)
        : asset('images/default-avatar.jpg'); // Fallback to a default image if no profile picture is set

    return response()->json([
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'role' => $user->role,
        'profilePic' => $profilePhotoUrl,
    ]);
}  

public function me(Request $request)
{
    return response()->json($request->user()); 
}

public function checkEmail(Request $request)
{
    $request->validate([
        'email' => 'required|email',
    ]);

    // Check if the email exists in the users table
    $emailExists = User::where('email', $request->email)->exists();

    if ($emailExists) {
        return response()->json(['message' => 'Email is already taken'], 200);
    } else {
        return response()->json(['message' => 'Email is available'], 200);
    }
}

public function updateEmailAndUsername(Request $request, $userId)
{
    // Validation
    $validated = $request->validate([
        'username' => 'required|string|max:255|unique:users,username,' . $userId,
        'email' => 'required|string|email|max:255|unique:users,email,' . $userId,
    ], [
        'username.unique' => 'This username is already taken.',
        'email.unique' => 'This email is already in use.',
    ]);

    try {
        // Fetch the user by ID
        $user = User::findOrFail($userId);

        // Update the email and username fields
        $user->username = $request->input('username');
        $user->email = $request->input('email');

        // Save the changes
        $user->save();

        // Return a success response
        return response()->json([
            'message' => 'Email and username updated successfully.',
            'user' => $user
        ], 200);

    } catch (\Exception $e) {
        // Log the error for debugging
        Log::error('Error updating email and username: ' . $e->getMessage(), [
            'exception' => $e,
            'userId' => $userId
        ]);

        // Return an error response
        return response()->json(['error' => 'Failed to update email and username'], 500);
    }
}
public function ChangePassword(Request $request)
{
    $request->validate([
        'current_password' => 'required',
        'new_password' => 'required|min:8|confirmed',
    ]);

    $user = auth()->user();

    // Check if the current password is correct
    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json(['error' => 'Current password is incorrect'], 422);
    }

    // Check if the new password is the same as the current password
    if (Hash::check($request->new_password, $user->password)) {
        return response()->json(['error' => 'New password cannot be the same as the current password.'], 422);
    }

    // Update the password
    $user->password = Hash::make($request->new_password);
    $user->is_first_login = 0;
    $user->save();

    return response()->json(['message' => 'Password changed successfully']);
}

    public function enableSpamNotifications() {
        
    }

    public function updateInfo(Request $request, $userId)
{
    try {
        $user = User::findOrFail($userId);

        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $userId,
            'contact_number' => 'required|regex:/^[0-9]{10,11}$/',
        ]);

        $user->update($validated);

        // Return proper success response
        return response()->json([
            'message' => 'User information updated successfully.',
            'user' => $user,
        ], 200); // Ensure 200 OK status
    } catch (\Exception $e) {
        // Return error response
        return response()->json([
            'message' => 'Failed to update user information.',
            'error' => $e->getMessage(),
        ], 500); // Return 500 status on failure
    }
}

    
}