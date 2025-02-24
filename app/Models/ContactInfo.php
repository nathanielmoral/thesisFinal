<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactInfo extends Model
{
    use HasFactory;
    protected $table = 'contact_info'; 

    protected $fillable = ['company_name', 'address', 'email', 'contact_number', 'telephone'];
}
