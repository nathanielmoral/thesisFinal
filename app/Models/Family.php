<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Family extends Model
{
    use HasFactory;

    protected $fillable = ['block', 'lot', 'account_holder_id'];

    // Relationship with User model
    public function accountHolder()
    {
        return $this->belongsTo(User::class, 'account_holder_id')->where('role', '!=', 'Renter');
    }

    // Relationship with User model for members
    public function members()
    {
        return $this->hasMany(User::class, 'family_id')->where('role', '!=', 'Renter');
    }

    public function userBlockLots()
    {
        return $this->hasMany(UserBlockLot::class, ['block', 'lot'], ['block', 'lot']);
    }

    // Relationship with User model for members
    public function tenants()
    {
        return $this->hasMany(User::class, 'family_id')->where('role', 'Renter');
    }
    // Relasyon sa Users
    public function users()
    {
        return $this->hasMany(User::class, 'family_id', 'id');
    }

    // Relasyon sa BlockAndLots (kung bawat pamilya ay konektado sa blocks)
    public function blockAndLots()
    {
        return $this->hasMany(BlockAndLot::class, 'family_id', 'id');
    }

}
