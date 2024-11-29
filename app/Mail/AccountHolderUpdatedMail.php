<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountHolderUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    /**
     * Create a new message instance.
     *
     * @param $user
     */
    public function __construct($user)
    {
        $this->user = $user;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Account Holder Updated')
                    ->view('emails.account_holder_updated')
                    ->with([
                        'firstName' => $this->user->firstName,
                        'lastName' => $this->user->lastName,
                        'block' => $this->user->block,
                        'lot' => $this->user->lot,
                    ]);
    }
}
