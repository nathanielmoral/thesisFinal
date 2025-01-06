<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateEmailNullableAndCollationInUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove existing unique constraint
            $table->dropUnique('users_email_unique'); // Adjust index name if necessary
            
            // Update email column
            $table->string('email')
                ->nullable()
                ->collation('utf8mb4_bin')
                ->unique()
                ->change();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']); // Drop the newly added unique constraint
            
            $table->string('email')
                ->nullable(false) // Revert to NOT NULL if needed
                ->collation('utf8mb4_unicode_ci')
                ->unique()
                ->change();
        });
    }
}
