<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMembersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id(); // Primary key
            $table->string('first_name'); // Member's first name
            $table->string('middle_name')->nullable(); // Member's middle name (optional)
            $table->string('last_name'); // Member's last name
            $table->date('birthdate'); // Member's date of birth
            $table->string('contact_number'); // Member's contact number
            $table->enum('gender', ['Male', 'Female']); // Member's gender
            $table->string('block')->nullable(); // Block assignment
            $table->string('lot')->nullable(); // Lot assignment
            $table->string('email')->nullable(); // Email is now nullable
            $table->enum('role', ['Homeowner', 'Renter'])->default('Renter'); // Default role is Renter
            $table->unsignedBigInteger('family_id')->nullable(); // Nullable family reference for renters
            $table->foreign('family_id')->references('id')->on('families')->onDelete('cascade'); // Foreign key constraint
            $table->timestamps(); // Created at and updated at timestamps
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('members');
    }
}
