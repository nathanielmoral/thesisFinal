<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class FeedbackController extends Controller
{
    public function index()
    {
        // Get all feedback entries
        return response()->json(Feedback::all());
    }
   
    public function store(Request $request)
    {
        // Validate the incoming feedback data
        $validated = $request->validate([
            'username_or_email' => 'required|email|max:255', // Validate as an email
            'message' => 'required|string|max:500',
        ]);
    
        // If validation is successful, create a new feedback entry in the database
        Feedback::create([
            'username_or_email' => $validated['username_or_email'],
            'message' => $validated['message'],
        ]);
    
        // Return a success response
        return response()->json(['message' => 'Feedback submitted successfully'], 201);
    }


    // Function to delete feedback
    public function destroy($id)
    {
        // Find the feedback by ID
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json(['message' => 'Feedback not found'], 404);
        }

        // Delete the feedback
        $feedback->delete();

        return response()->json(['message' => 'Feedback deleted successfully'], 200);
    }

    // Function to reply to feedback
    public function reply(Request $request, $id)
    {
        // Validate the reply message
        $validated = $request->validate([
            'reply_message' => 'required|string|max:500',
        ]);

        // Find the feedback by ID
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json(['message' => 'Feedback not found'], 404);
        }

        // Send reply email to the user
        try {
            Mail::raw($validated['reply_message'], function ($message) use ($feedback) {
                $message->to($feedback->username_or_email)
                        ->subject('Reply to Your Feedback');
            });

            return response()->json(['message' => 'Reply sent successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send reply', 'error' => $e->getMessage()], 500);
        }
    }
    
    
}
