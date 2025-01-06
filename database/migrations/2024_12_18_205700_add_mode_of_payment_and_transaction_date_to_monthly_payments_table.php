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
        Schema::table('monthly_payments', function (Blueprint $table) {
            $table->string('mode_of_payment')->nullable(); // Add mode of payment
            $table->timestamp('transaction_date')->nullable(); // Add transaction date
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('monthly_payments', function (Blueprint $table) {
            $table->dropColumn(['mode_of_payment', 'transaction_date']); // Remove added columns
        });
    }
};
