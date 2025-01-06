import React, { useState, useEffect } from 'react';
import { BeatLoader } from 'react-spinners';

const UserListModal = ({ show, onClose, onConfirm, title, user, loading }) => {
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [block, setBlock] = useState('');
    const [lot, setLot] = useState('');
    const [gender, setGender] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setMiddleName(user.middleName || '');
            setLastName(user.lastName || '');
            setEmail(user.email || '');
            setRole(user.role || '');
            setContactNumber(user.contact_number || '');
            setBlock(user.block || '');
            setLot(user.lot || '');
            setGender(user.gender || '');
            setBirthdate(user.birthdate || '');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {};

        // Validate Contact Number
        const mobileRegex = /^(09\d{9}|(\+639)\d{9})$/;
        if (!contactNumber.trim()) {
            newErrors.contactNumber = "Contact Number is required.";
        } else if (!mobileRegex.test(contactNumber)) {
            newErrors.contactNumber =
                "Invalid contact number. Please use the format '09XXXXXXXXX' or '+639XXXXXXXXX'.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors); // Set errors if there are any
            return;
        }

        // Map the role to userType
        const updatedUser = {
            firstName,
            middleName,
            lastName,
            role,
            contact_number: contactNumber,
            block,
            lot,
            gender,
            birthdate,
            userType: role === 'Administrator' ? '1' : '0', // 1 for Administrator, 0 for others
        };
        
        if (email.trim() !== '') {
            updatedUser.email = email; // Include email only if it's not empty
        }

        console.log('Submitting Updated User:', updatedUser);
        await onConfirm(updatedUser);
        onClose();
    };

    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[999]">
            <div className="relative p-6 border w-full max-w-4xl mx-auto shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-xl font-bold leading-6 text-gray-900">{title}</h3>
                    <form onSubmit={handleSubmit} className="mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="firstName">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="First Name"
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="middleName">
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    id="middleName"
                                    name="middleName"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Middle Name"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="lastName">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Last Name"
                                     required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Email"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="contactNumber">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    id="contactNumber"
                                    name="contactNumber"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Contact Number"
                                />
                                {errors.contactNumber && (
                                    <p className="text-red-500 text-sm mt-1">{errors.contactNumber}</p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="block">
                                    Block
                                </label>
                                <input
                                    type="text"
                                    id="block"
                                    name="block"
                                    value={block}
                                    onChange={(e) => setBlock(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Block"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="lot">
                                    Lot
                                </label>
                                <input
                                    type="text"
                                    id="lot"
                                    name="lot"
                                    value={lot}
                                    onChange={(e) => setLot(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Lot"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="gender">
                                    Gender
                                </label>
                                <input
                                    type="text"
                                    id="gender"
                                    name="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Gender"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="birthdate">
                                    Birthdate
                                </label>
                                <input
                                    type="date"
                                    id="birthdate"
                                    name="birthdate"
                                    value={birthdate}
                                    onChange={(e) => setBirthdate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-semibold text-gray-700" htmlFor="role">
                                    User Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="">Select a role</option>
                                    <option value="Administrator">Administrator</option>
                                    <option value="Homeowner">Homeowner</option>
                                    <option value="Renter">Renter</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-center space-x-2 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                disabled={loading}
                            >
                                {loading ? <BeatLoader size={10} color="#fff" /> : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserListModal;
