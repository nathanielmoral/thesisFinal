<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRentersTable extends Migration
{
    public function up()
    {
        Schema::create('renters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Foreign key mula sa users table
            $table->unsignedBigInteger('block_lot_id'); // Foreign key mula sa block_and_lots table
            $table->string('status')->default('active'); // Status ng renter
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('block_lot_id')->references('id')->on('block_and_lots')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('renters');
    }
}
