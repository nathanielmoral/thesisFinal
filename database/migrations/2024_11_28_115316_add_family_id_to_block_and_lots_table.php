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
            $table->unsignedBigInteger('family_id')->nullable()->after('id');
        });
    }
    
    public function down()
    {
        Schema::table('block_and_lots', function (Blueprint $table) {
            $table->dropColumn('family_id');
        });
    }
    
};
