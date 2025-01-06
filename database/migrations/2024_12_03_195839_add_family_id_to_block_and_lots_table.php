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
        Schema::table('block_and_lots', function (Blueprint $table) {
            $table->unsignedBigInteger('family_id')->nullable()->after('status');
            $table->foreign('family_id')->references('id')->on('families')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('block_and_lots', function (Blueprint $table) {
            $table->dropForeign(['family_id']);
            $table->dropColumn('family_id');
        });
    }
};
