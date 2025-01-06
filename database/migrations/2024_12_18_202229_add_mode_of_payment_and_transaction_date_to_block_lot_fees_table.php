<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('block_lot_fees', function (Blueprint $table) {
            $table->string('mode_of_payment')->nullable(); // For mode of payment (e.g., cash, bank transfer)
            $table->date('transaction_date')->nullable();  // For transaction date
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('block_lot_fees', function (Blueprint $table) {
            $table->dropColumn(['mode_of_payment', 'transaction_date']);
        });
    }
};
