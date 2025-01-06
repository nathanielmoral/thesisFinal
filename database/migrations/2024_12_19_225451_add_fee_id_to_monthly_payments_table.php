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
            $table->unsignedBigInteger('fee_id')->nullable()->after('transaction_date'); // Add fee_id column
        });
    }
    
    public function down()
    {
        Schema::table('monthly_payments', function (Blueprint $table) {
            $table->dropColumn('fee_id'); // Drop fee_id column
        });
    }
};
