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
        Schema::table('user_payments', function (Blueprint $table) {
            // Make the user_id column nullable
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('user_payments', function (Blueprint $table) {
            // Revert the user_id column to not nullable
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
