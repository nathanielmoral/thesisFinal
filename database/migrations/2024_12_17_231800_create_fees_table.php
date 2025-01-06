<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('fees', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Name of the fee/service
            $table->text('description')->nullable(); // Optional description
            $table->decimal('amount', 10, 2); // Amount to be paid
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('fees');
    }
};
