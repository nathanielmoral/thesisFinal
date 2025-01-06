<?php

// database/migrations/xxxx_xx_xx_create_user_block_lot_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserBlockLotTable extends Migration
{
    public function up()
    {
        Schema::create('user_block_lot', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('block');
            $table->string('lot');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_block_lot');
    }
}
