import React, { useState, useEffect } from 'react';
import { fetchUserDetails } from '../api/user';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

const TenantsList = () => {
    const [tenants, setTenants] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedLot, setSelectedLot] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [user, setUser] = useState({});
    const [userId, setUserId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const [ownedBlocksLots, setOwnedBlocksLots] = useState([]);
    const [tenantToDelete, setTenantToDelete] = useState(null);
    const [tenantForm, setTenantForm] = useState({
        id: null,
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        contactNumber: "",
        gender: "",
        block: "", // Initialize as empty string
        lot: "", // Initialize as empty string
        blockAndLot: "", // Optional combined field
        birthdate: "",
        family_id: "",
        username: "",
        nameOfOwner: "",
    });
    
    const fetchOwnedBlocksLots = async () => {
        try {
            const response = await fetch(`/api/user/${userId}/owned-blocks-lots`);
            const result = await response.json();
            if (response.ok) {
                setOwnedBlocksLots(result.data); 
            } else {
                toast.error(result.message || 'Failed to fetch blocks and lots.');
            }
        } catch (error) {
            console.error('Error fetching blocks and lots:', error);
            toast.error('Error fetching blocks and lots.');
        }
    };

    useEffect(() => {
        if (userId) {
            fetchOwnedBlocksLots();
        }
    }, [userId]);

    const filteredTenants = tenants.filter((tenant) => {
        const matchesBlock = selectedBlock ? tenant.block === selectedBlock : true;
        const matchesLot = selectedLot ? tenant.lot === selectedLot : true;
        return matchesBlock && matchesLot;
    });

    const fetchTenants = async (userId) => {
        try {
            const response = await fetch(
                `/api/user/tenants/${userId}?page=${currentPage}&search=${search}`
            );
            const data = await response.json();
            console.log('API Response:', data); // Debugging
            setTenants(data.data);
            setTotalPages(data.last_page);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const computeAge =(birthdate) => {
        if (!birthdate) return "N/A";
        const today = new Date();
        const birthDate = new Date (birthdate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if(monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())){
            age--;
        }
        return age;
    }
    

    const fetchUserData = async () => {
        try {
            const data = await fetchUserDetails();
            if (data && data.id) {
                setUser(data);
                setUserId(data.id);
                fetchTenants(data.id);
            } else {
                toast.error('Fetched user data does not include an ID');
            }
        } catch (err) {
            toast.error('Error fetching user details');
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchTenants(userId);
        }
    }, [search, currentPage, userId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
    
        if (name === "blockAndLot") {
            const [block, lot] = value.split(",");
            setTenantForm((prev) => ({
                ...prev,
                block,
                lot,
                blockAndLot: value, // Optional combined field
            }));
        } else {
            setTenantForm((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };
    

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchTenants(userId);
        }
    }, [search, currentPage, userId]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
    
        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(tenantForm.email)) {
            toast.error('Please enter a valid email address!');
            return;
        }
    
        // Contact number validation (only digits, 10-12 characters)
        const contactRegex = /^\d{10,12}$/;
        if (!contactRegex.test(tenantForm.contactNumber)) {
            toast.error('Contact number must be 10 to 12 digits long!');
            return;
        }
    
        // Birthdate validation
        if (!tenantForm.birthdate) {
            toast.error('Birthdate is required!');
            return;
        }
        const today = new Date();
        const birthDate = new Date(tenantForm.birthdate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
    
        if (age <= 0 || isNaN(age)) {
            toast.error('Please enter a valid birthdate!');
            return;
        }
    
        // Validate required fields
        if (
            !tenantForm.firstName ||
            !tenantForm.lastName ||
            !tenantForm.email ||
            !tenantForm.contactNumber ||
            !tenantForm.gender ||
            !tenantForm.block ||
            !tenantForm.lot
        ) {
            toast.error('Please fill in all required fields!');
            return;
        }
    
        setShowLoader(true);
        try {
            const method = tenantForm.id ? 'PUT' : 'POST';
            const url = tenantForm.id
                ? `/api/user/tenants/${tenantForm.id}`
                : '/api/user/tenants/new';
    
            const tenantData = {
                firstName: tenantForm.firstName,
                middleName: tenantForm.middleName,
                lastName: tenantForm.lastName,
                email: tenantForm.email,
                contactNumber: tenantForm.contactNumber,
                gender: tenantForm.gender,
                birthdate: tenantForm.birthdate,
                block: tenantForm.block,
                lot: tenantForm.lot,
                family_id: tenantForm.family_id,
                username: tenantForm.username,
                nameOfOwner: tenantForm.nameOfOwner,
            };
    
        // Auto-fill additional data for a new tenant
        if (method === 'POST') {
            tenantData['username'] = (
                `${tenantForm.firstName}${tenantForm.middleName}${tenantForm.lastName}`
            ).toLowerCase();

            // Use manually selected block and lot instead of homeowner's block and lot
            tenantData['block'] = tenantForm.block;
            tenantData['lot'] = tenantForm.lot;

            tenantData['nameOfOwner'] = `${user.firstName} ${user.lastName}`;
            tenantData['family_id'] = user.family_id;
        }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tenantData),
            });
    
            if (response.ok) {
                toast.success(
                    `${tenantForm.id ? 'Updated' : 'Added'} tenant successfully!`
                );
                fetchTenants(userId); // Refresh the tenant list
                setIsModalOpen(false);
                setTenantForm({
                    id: null,
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    email: '',
                    contactNumber: '',
                    gender: '',
                    block: '',
                    lot: '',
                    blockAndLot: '', // Reset combined field
                    birthdate: '',
                    family_id: '',
                    username: '',
                    nameOfOwner: '',
                });
            } else {
                toast.error('Error saving tenant');
            }
        } catch (error) {
            toast.error('Error saving tenant');
            console.error(error);
        } finally {
            setShowLoader(false);
        }
    };
    

    const deleteTenant = async () => {
        if (!tenantToDelete) {
            toast.error("No tenant selected for deletion.");
            return;
        }
    
        // Check if the tenant is an account holder
        if (tenantToDelete.is_account_holder === 1) {
            const tenantsInBlockAndLot = tenants.filter(
                (tenant) =>
                    tenant.block === tenantToDelete.block &&
                    tenant.lot === tenantToDelete.lot &&
                    tenant.is_account_holder === 1
            );
    
            if (tenantsInBlockAndLot.length > 1) {
                toast.error("Cannot delete this tenant as they are an account holder.");
                return;
            }
        }
    
        setShowLoader(true);
        try {
            const response = await fetch(`/api/user/tenants/${tenantToDelete.id}`, {
                method: "DELETE",
            });
    
            if (response.ok) {
                const data = await response.json();
                toast.success(data.message || "Tenant deleted successfully.");
                fetchTenants(userId);
                setIsDeleteModalOpen(false);
                setTenantToDelete(null);
            } else {
                toast.error("Failed to delete tenant.");
            }
        } catch (error) {
            console.error("Error deleting tenant:", error);
            toast.error("An error occurred while deleting the tenant.");
        } finally {
            setShowLoader(false);
        }
    };
    

    const openAddTenantModal = () => {
        setIsModalOpen(true);
        setTenantForm((prev) => ({
            ...prev,
            id: null, // Reset the ID
            firstName: '', // Reset tenant form fields
            middleName: '',
            lastName: '',
            email: '',
            contactNumber: '',
            gender: '',
            birthdate: '',
            blockAndLot: prev.blockAndLot || '', // Keep the last selected block and lot
            block: prev.block || '', // Preserve block
            lot: prev.lot || '', // Preserve lot
        }));
    };
    

    const openEditTenantModal = (tenant) => {
        setIsModalOpen(true);
        setTenantForm({
            id: tenant.id,
            firstName: tenant.firstName,
            middleName: tenant.middleName,
            lastName: tenant.lastName,
            email: tenant.email,
            contactNumber: tenant.contact_number,
            gender: tenant.gender,
            birthdate: tenant.birthdate,
            block: tenant.block,
            lot: tenant.lot,
            blockAndLot: `${tenant.block},${tenant.lot}`,
        });
    };
    

    const changeAccountHolder = async (tenantId) => {
        try {
            setShowLoader(true);
            const tenantToUpdate = tenants.find((tenant) => tenant.id === tenantId);
    
            if (!tenantToUpdate) {
                toast.error("Tenant not found!");
                return;
            }
    
            // Check for existing account holders in the same Block and Lot
            const tenantsInBlockAndLot = tenants.filter(
                (tenant) =>
                    tenant.block === tenantToUpdate.block &&
                    tenant.lot === tenantToUpdate.lot &&
                    tenant.is_account_holder === 1
            );
    
            if (tenantToUpdate.is_account_holder === 0 && tenantsInBlockAndLot.length > 0) {
                toast.error("There is already an account holder in this Block and Lot.");
                return;
            }
    
            const response = await fetch(`/api/user/tenants/holder/${tenantId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    is_account_holder: tenantToUpdate.is_account_holder === 1 ? 0 : 1,
                }),
            });
    
            if (response.ok) {
                toast.success("Account holder status updated successfully!");
                fetchTenants(userId); // Refresh tenant list
            } else {
                toast.error("Failed to update account holder status.");
            }
        } catch (error) {
            toast.error("An error occurred while updating account holder status.");
            console.error(error);
        } finally {
            setShowLoader(false);
        }
    };
    

    return (
        <div className="container mx-auto p-6">
             <h2 className="text-2xl font-bold mb-4 text-center md:text-left">
                Tenant Management 
            </h2>
            {showLoader && (
                <div className="p-10 fixed inset-0 bg-white/70 flex flex-col justify-center items-center gap-3 z-[999]">
                    <svg
                        className="animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="-0.5 -0.5 16 16"
                        fill="none"
                        stroke="#ff5a1f"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        height="48"
                        width="48"
                    >
                        <path
                            d="M7.5 1.875a5.625 5.625 0 1 0 5.625 5.625"
                            stroke-width="1"
                        ></path>
                    </svg>
                    <p className="font-semibold text-gray-600">
                        Please wait while we process your request...
                    </p>
                </div>
            )}
            <ToastContainer />
            <div className="flex flex-col md:flex-row items-center gap-4 py-4 bg-white">
                {/* Search Input */}
                <div className="relative w-full md:w-1/3">
                    <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    >
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2"
                        d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    />
                    </svg>
                    <input
                    type="text"
                    placeholder="Search Residents"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input w-full pl-12 py-2 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                </div>
                <div className="flex gap-4 ">
                    {/* Block Filter */}
                    <select
                        value={selectedBlock}
                        onChange={(e) => setSelectedBlock(e.target.value)}
                        className="border p-2 rounded-md"
                    >
                        <option value="">Filter by Block</option>
                        {Array.from(new Set(tenants.map((tenant) => tenant.block))).map(
                            (block, index) => (
                                <option key={index} value={block}>
                                    Block {block}
                                </option>
                            )
                        )}
                    </select>

                    {/* Lot Filter */}
                    <select
                        value={selectedLot}
                        onChange={(e) => setSelectedLot(e.target.value)}
                        className="border p-2 rounded-md"
                    >
                        <option value="">Filter by Lot</option>
                        {Array.from(new Set(tenants.map((tenant) => tenant.lot))).map(
                            (lot, index) => (
                                <option key={index} value={lot}>
                                    Lot {lot}
                                </option>
                            )
                        )}
                    </select>
                </div>

                {/* Add Representative Button */}
                <button
                    onClick={openAddTenantModal}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    Add Authorize Representative
                </button>
            </div>

            {/* Tenants Table */}
            <div className="bg-white shadow-sm rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Full Name</th>
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Contact Number</th>
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Block and Lot</th>
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Birthday</th>
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Age</th>
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Account Holder</th>
                                <th className="px-2 py-2  text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                           {filteredTenants.length > 0 ? (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                            {tenant.firstName} {tenant.middleName} {tenant.lastName}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{tenant.email}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                            {tenant.contact_number ?? 'No contact number'}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                            {tenant.block && tenant.lot
                                                ? `Block ${tenant.block}, Lot ${tenant.lot}`
                                                : 'No Block and Lot Assigned'}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{tenant.birthdate}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{computeAge(tenant.birthdate)}</td>
                                        <td className="px-4 py-2 text-xs md:text-sm text-center">
                                            <div className="flex justify-center items-center">
                                            <label
                                                className={`relative inline-flex items-center ${
                                                    tenant.is_account_holder === 1 && tenants.filter(
                                                        (t) =>
                                                            t.block === tenant.block &&
                                                            t.lot === tenant.lot &&
                                                            t.is_account_holder === 1
                                                    ).length > 1
                                                        ? "cursor-not-allowed opacity-70"
                                                        : "cursor-pointer"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={tenant.is_account_holder === 1}
                                                    disabled={
                                                        tenant.is_account_holder === 1 &&
                                                        tenants.filter(
                                                            (t) =>
                                                                t.block === tenant.block &&
                                                                t.lot === tenant.lot &&
                                                                t.is_account_holder === 1
                                                        ).length > 1
                                                    }
                                                    onChange={() => changeAccountHolder(tenant.id)}
                                                />
                                                <span
                                                    className={`w-11 h-6 rounded-full ${
                                                        tenant.is_account_holder === 1 ? "bg-green-600" : "bg-gray-200"
                                                    }`}
                                                ></span>
                                                <span
                                                    className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                                                        tenant.is_account_holder === 1
                                                            ? "transform translate-x-5 bg-blue-600"
                                                            : ""
                                                    }`}
                                                ></span>
                                            </label>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-xs md:text-sm text-center flex gap-2 justify-center">                                          
                                             {/* Edit Tenant Button */}
                                             <button
                                                onClick={() => openEditTenantModal(tenant)}
                                                className="bg-yellow-500 hover:bg-yellow-600  flex items-center text-white px-3 py-1 rounded-md text-xs md:text-sm font-medium shadow-md transition-colors"
                                            >
                                                <FaEdit className="mr-1" />
                                                Update
                                            </button>
                                                {/* Remove Tenant Button */}
                                            {(tenant.is_account_holder === 0 || tenants.length === 1) && (
                                                <button
                                                    onClick={() => {
                                                        setTenantToDelete(tenant);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 flex items-center text-white px-3 py-1 rounded-md text-xs md:text-sm font-medium shadow-md transition-colors"
                                                >
                                                    <FaTrash className ="mr-1"/>
                                                    Delete
                                                </button>                                             
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className=" px-4 py-6 text-center text-sm text-gray-500"
                                    >
                                        No tenants found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                </div>
                <div className="p-4 flex justify-between items-center">
                    <button
                        onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                            )
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

{isModalOpen && (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-4 rounded-md shadow-md">
            <h2 className="text-xl font-semibold mb-4">
                {tenantForm.id ? 'Edit Tenant' : 'Save Tenant'}
            </h2>
            <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="firstName"
                        value={tenantForm.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        className="border p-2 rounded-md"
                        required
                    />
                    <input
                        type="text"
                        name="middleName"
                        value={tenantForm.middleName}
                        onChange={handleInputChange}
                        placeholder="Middle Name"
                        className="border p-2 rounded-md"
                    />
                    <input
                        type="text"
                        name="lastName"
                        value={tenantForm.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                        className="border p-2 rounded-md"
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        value={tenantForm.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        className="border p-2 rounded-md"
                        required
                    />
                    <input
                        type="text"
                        name="contactNumber"
                        value={tenantForm.contactNumber}
                        onChange={handleInputChange}
                        placeholder="Contact Number"
                        className="border p-2 rounded-md"
                        required
                    />
                        <select
                        name="gender"
                        value={tenantForm.gender}
                        onChange={handleInputChange}
                        className="border p-2 rounded-md"
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>

                    <select
                        name="blockAndLot"
                        value={`${tenantForm.block},${tenantForm.lot}`}
                        onChange={handleInputChange}
                        className="border p-2 rounded-md"
                        required
                    >
                        <option value="">Select Block and Lot</option>
                        {ownedBlocksLots.map((blockLot) => (
                            <option
                                key={`${blockLot.block}-${blockLot.lot}`}
                                value={`${blockLot.block},${blockLot.lot}`}
                            >
                                Block {blockLot.block}, Lot {blockLot.lot}
                            </option>
                        ))}
                    </select>

                    <input
                    type="date"
                    name="birthdate"
                    value={tenantForm.birthdate || ''}
                    onChange={(e) => {
                        handleInputChange(e);
                        const today = new Date();
                        const birthDate = new Date(e.target.value);
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }

                        setTenantForm((prev) => ({ ...prev, age }));
                    }}
                    className="border p-2 rounded-md"
                    required
                />
                <input
                    type="number"
                    name="age"
                    value={tenantForm.age || ''}
                    readOnly
                    placeholder="Age"
                    className="border p-2 rounded-md bg-gray-100 cursor-not-allowed"
                />

                </div>
                <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded-md mr-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        {tenantForm.id ? 'Update' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-md shadow-md text-center">
                        <p className="mb-4 text-gray-700">
                            Are you sure you want to delete this tenant?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-gray-300 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteTenant}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsList;
