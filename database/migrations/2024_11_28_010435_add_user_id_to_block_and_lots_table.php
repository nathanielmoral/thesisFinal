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
        Schema::table('block_and_lots', function (Blueprint $table) {
            // Add the user_id column after the status column
            $table->unsignedBigInteger('user_id')->nullable()->after('status');

            // Add a foreign key constraint with "set null" on delete
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null'); // Sets user_id to null if the user is deleted
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('block_and_lots', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['user_id']);

            // Drop the user_id column
            $table->dropColumn('user_id');
        });
    }
};
