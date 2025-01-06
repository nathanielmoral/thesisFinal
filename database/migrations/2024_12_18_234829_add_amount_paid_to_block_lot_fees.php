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
            $table->decimal('amount_paid', 10, 2)->default(0)->after('transaction_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('block_lot_fees', function (Blueprint $table) {
            $table->dropColumn('amount_paid');
        });
    }
};
