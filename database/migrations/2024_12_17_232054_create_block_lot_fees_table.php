<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('block_lot_fees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fee_id'); // Reference to the fees table
            $table->unsignedBigInteger('account_holder_id'); // Reference to the account holder in the users table
            $table->integer('month'); // Month (1 = January, 12 = December)
            $table->year('year'); // Year
            $table->string('payment_status')->default('Unpaid');
            $table->string('transaction_reference')->nullable(); // Transaction Reference Number
            $table->string('proof_of_payment')->nullable(); // Proof of Payment (File Path)
            $table->softDeletes();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('fee_id')->references('id')->on('fees')->onDelete('cascade');
            $table->foreign('account_holder_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('block_lot_fees');
    }
};
