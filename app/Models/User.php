<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasProfilePhoto, Notifiable, TwoFactorAuthenticatable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'firstName',
        'middleName',
        'lastName',
        'contact_number',
        'family_id',
        'block',
        'lot',
        'proofOfResidency',
        'gender',
        'email',
        'birthdate',
        'username',
        'account_number',
        'role',
        'nameOfOwner',
        'usertype',
        'password',
        'position',       
        'start_of_term',   
        'end_of_term',
        'is_account_holder',
        'is_first_login'     
    ];
    
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
    
    public function userPayments()
    {
        return $this->hasMany(UserPayment::class);
    }

    public function getAgeAttribute()
    {
        return $this->birthdate ? Carbon::parse($this->birthdate)->age : null;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_photo_url',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function boardMember()
    {
        return $this->hasOne(BoardMember::class, 'user_id');
    }

    public function family()
    {
        return $this->belongsTo(Family::class, 'id', 'family_id');
    }
  

    public function assignFamilyId()
    {
        // Example: Group users based on block and lot
        $family = Family::firstOrCreate([
            'block' => $this->block,
            'lot' => $this->lot,
        ]);

        // Assign family_id to the user
        $this->family_id = $family->id;
        $this->save();
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }
    public function block()
    {
        return $this->hasOne(BlockAndLot::class);
    }
    // Relasyon sa BlockAndLots
    public function blockAndLots()
    {
        return $this->hasMany(BlockAndLot::class, 'user_id', 'id');
    }

    public function blocksAndLots()
    {
        return $this->hasMany(UserBlockLot::class);
    }

    public function blockAndLot()
    {
        return $this->belongsTo(BlockAndLot::class, 'block_lot_id');
    }
     // One-to-Many relationship to UserBlockLot
     public function userBlockLots()
     {
         return $this->hasMany(UserBlockLot::class, 'user_id');
     }
     
     public function blockLotFees()
     {
         return $this->hasMany(BlockLotFee::class, 'account_holder_id'); // Replace 'account_holder_id' with the correct foreign key if different
     }

            // Relationship with MonthlyPayment
            public function payment()
            {
                return $this->hasMany(MonthlyPayment::class, 'user_id');
            }

            // Relationship with other family members
            public function familyMembers()
            {
                return $this->hasMany(User::class, 'family_id', 'family_id');
            }
                
            public function ownedBlocksLots()
            {
                return $this->hasMany(BlockAndLot::class, 'user_id');
            }
            

}