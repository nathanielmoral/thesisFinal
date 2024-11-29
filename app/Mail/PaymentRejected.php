<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $transactionReference;
    public $rejectReason;

    /**
     * Create a new message instance.
     *
     * @param $user
     * @param $transactionReference
     * @param $rejectReason
     */
    public function __construct($user, $transactionReference, $rejectReason)
    {
        $this->user = $user;
        $this->transactionReference = $transactionReference;
        $this->rejectReason = $rejectReason;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Payment Rejected')
                    ->view('emails.payment_rejected');
    }
}
