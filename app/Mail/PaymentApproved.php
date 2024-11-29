<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $transactionReference;
    public $amount;
    public $periodCovered;
    public $transactionDate;

    /**
     * Create a new message instance.
     *
     * @param $user
     * @param $transactionReference
     * @param $amount
     * @param $periodCovered
     * @param $transactionDate
     */
    public function __construct($user, $transactionReference, $amount, $periodCovered, $transactionDate)
    {
        $this->user = $user;
        $this->transactionReference = $transactionReference;
        $this->amount = $amount;
        $this->periodCovered = $periodCovered;
        $this->transactionDate = $transactionDate;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Payment Approved')
            ->view('emails.payment_approved');
    }
}
