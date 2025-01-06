<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'birthdate',
        'contact_number',
        'gender',
        'block',
        'lot',
        'email',
        'role',
        'family_id',
    ];

    public function homeowner()
{
    return $this->belongsTo(User::class, 'family_id', 'id');
}

}
