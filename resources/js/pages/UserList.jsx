import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useLocation } from 'react-router-dom';
import UserListModal from './modals/UserListModal';
import DeleteModal from './modals/DeleteModal';
import Breadcrumbs from '../components/Breadcrumbs';
import Pagination from '../components/pagination';
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Toast from '../components/Toast';



const UserList = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState(''); // New role filter state
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const location = useLocation(); 
    const crumbs = getBreadcrumbs(location);
    const [blockFilter, setBlockFilter] = useState('');
    const [lotFilter, setLotFilter] = useState('');


    const handleBlockFilterChange = (e) => setBlockFilter(e.target.value);
    const handleLotFilterChange = (e) => setLotFilter(e.target.value);

    useEffect(() => {
        axiosInstance.get('/users/approved')
            .then(response => {
                setUsers(response.data);
                setFilteredUsers(response.data);
                setError('');
            })
            .catch(error => {
                console.error('Error fetching approved users:', error);
                setError('Failed to load approved users. Please try again later.');
            });
    }, []);

    useEffect(() => {
        let filtered = users;

        if (searchQuery) {
            filtered = filtered.filter(user =>
                `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(user => user.role.toLowerCase() === roleFilter.toLowerCase());
        }

        if (blockFilter) {
            filtered = filtered.filter(user => user.block === blockFilter);
        }

        if (lotFilter) {
            filtered = filtered.filter(user => user.lot === lotFilter);
        }

        setFilteredUsers(filtered);
    }, [searchQuery, roleFilter, blockFilter, lotFilter, users]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleRoleFilterChange = (e) => {
        setRoleFilter(e.target.value);
    };

    const handleEntriesPerPageChange = (event) => {
        setEntriesPerPage(Number(event.target.value));
        setCurrentPage(1); // Reset to first page when changing entries per page
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleUpdate = (user) => {
        setModalTitle('Update User');
        setSelectedUser(user);
        setShowUpdateModal(true);
    };

    const handleDelete = (user) => {
        setModalTitle('Delete User');
        setModalContent('Are you sure you want to delete this user?');
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleConfirmUpdate = async (updatedUser) => {
        console.log('Updated User:', updatedUser);
        setLoading(true);
        try {
          const response = await axiosInstance.put(`/users/${selectedUser.id}`, updatedUser, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
      
          // Update user lists
          setUsers(users.map(user => (user.id === selectedUser.id ? response.data : user)));
          setFilteredUsers(filteredUsers.map(user => (user.id === selectedUser.id ? response.data : user)));
      
          // Close the update modal
          setShowUpdateModal(false);
      
          // Show success toast
          setSuccessMessage('User successfully updated!');
          setShowToast(true);
      
          // Hide the toast after 3 seconds
          setTimeout(() => {
            setShowToast(false);
            setSuccessMessage('');
          }, 3000);
        } catch (error) {
          console.error('Error updating user:', error.response?.data || error.message);
          setError('Failed to update user. Please try again later.');
      
          // Show error toast
          setSuccessMessage('Failed to update user.');
          setShowToast(true);
      
          // Hide the toast after 3 seconds
          setTimeout(() => {
            setShowToast(false);
            setSuccessMessage('');
          }, 3000);
        } finally {
          setLoading(false);
        }
      };
      const handleConfirmDelete = async () => {
        setLoading(true);
        try {
          await axiosInstance.delete(`/users/${selectedUser.id}`);
      
          // Update user lists
          setUsers(users.filter(user => user.id !== selectedUser.id));
          setFilteredUsers(filteredUsers.filter(user => user.id !== selectedUser.id));
      
          // Close the delete modal
          setShowDeleteModal(false);
      
          // Show success toast
          setSuccessMessage('User successfully deleted!');
          setShowToast(true);
      
          // Hide the toast after 3 seconds
          setTimeout(() => {
            setShowToast(false);
            setSuccessMessage('');
          }, 3000);
        } catch (error) {
          console.error('Error deleting user:', error);
          setError('Failed to delete user. Please try again later.');
      
          // Show error toast
          setSuccessMessage('Failed to delete user.');
          setShowToast(true);
      
          // Hide the toast after 3 seconds
          setTimeout(() => {
            setShowToast(false);
            setSuccessMessage('');
          }, 3000);
        } finally {
          setLoading(false);
        }
      };

    // Pagination setup
    const indexOfLastUser = currentPage * entriesPerPage;
    const indexOfFirstUser = indexOfLastUser - entriesPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
    const capitalizeFirstLetter = (string) => {
        return string.replace(/\b\w/g, (char) => char.toUpperCase());
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
    const handlePrintUsersList = () => {
        const computeAge = (birthdate) => {
            if (!birthdate) return "N/A";
            const today = new Date();
            const birthDate = new Date(birthdate);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

        const printWindow = window.open('', '_blank');
        const printableContent = `
            <html>
            <head>
                <title>Filtered Users List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; font-weight: bold; }
                    h1 { text-align: center; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>Filtered Users List</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Mobile Number</th>
                            <th>Block</th>
                            <th>Lot</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentUsers.map(userOrMember => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                ${userOrMember.firstName ? 
                                    `${userOrMember.firstName || "N/A"} ${userOrMember.middleName || ""} ${userOrMember.middleInitial || ""} ${userOrMember.lastName || "N/A"}`.trim() 
                                    : userOrMember.first_name ? 
                                    `${userOrMember.first_name || "N/A"} ${userOrMember.middle_name || ""} ${userOrMember.last_name || "N/A"}`.trim() 
                                    : "N/A"}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">${userOrMember.email || "Not Provided"}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${userOrMember.contact_number || "N/A"}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${userOrMember.block || "N/A"}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${userOrMember.lot || "N/A"}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${userOrMember.gender || "N/A"}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${computeAge(userOrMember.birthdate)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${userOrMember.role || "N/A"}</td>
                        </tr>
                    `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(printableContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <div className=" min-h-screen relative overflow-x-auto shadow-md sm:rounded-md p-4 bg-[#FAFAFA]">

                    {showToast && (
                    <Toast
                        message={successMessage}
                        type={successMessage.includes('Failed') ? 'danger' : 'success'}
                        onClose={() => setShowToast(false)}
                    />
                    )}

            {error && <div className="bg-red-500 text-white p-4 mb-4">{error}</div>}

            <div className="bg-slate-200 rounded-md mb-6">
                <Breadcrumbs crumbs={crumbs} />
            </div>

            <h1 className="text-4xl font-bold mb-6">User list</h1>

            <div className="mb-6">
            {/* Row 1: Search Input and Print Button */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="w-full md:w-2/3 lg:w-1/4 relative">
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
                        value={searchQuery}
                        onChange={handleSearch}
                        className="form-input w-full pl-12 py-2 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                    </div>

                    {/* Print Button */}
                    <div>
                    <button
                        onClick={handlePrintUsersList}
                        className=" bg-indigo-600 flex items-center text-white px-4 py-2 rounded-md text-sm font-sans shadow hover:bg-indigo-700 transition"
                    >
                        <svg class="w-6 h-6 mr-1 text-gray-800 dark:text-white" 
                        aria-hidden="true" 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        fill="none" 
                        viewBox="0 0 24 24">
                          <path 
                          stroke="white" 
                          stroke-linejoin="round"
                          stroke-width="2" 
                           d="M16.444 18H19a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2.556M17 11V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6h10ZM7 15h10v4a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-4Z"/>
                        </svg>
                        Print Users List
                    </button>
                    </div>
                </div>

            {/* Row 2: Filters and Entries */}
            <div className="flex flex-wrap items-center  gap-4 mt-4">
                {/* Filters */}
                <div className="flex items-center gap-2">
                <label htmlFor="roleFilter" className="text-sm font-medium text-gray-700">
                    Role:
                </label>
                <select
                    id="roleFilter"
                    value={roleFilter}
                    onChange={handleRoleFilterChange}
                    className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Roles</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Homeowner">Homeowner</option>
                    <option value="Renter">Renter</option>
                </select>
                </div>

                <div className="flex items-center gap-2">
                <label htmlFor="blockFilter" className="text-sm font-medium text-gray-700">
                    Block:
                </label>
                <select
                    id="blockFilter"
                    value={blockFilter}
                    onChange={handleBlockFilterChange}
                    className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Blocks</option>
                    {[...new Set(users.map((user) => user.block))].map((block) => (
                    <option key={block} value={block}>
                        {block}
                    </option>
                    ))}
                </select>
                </div>

                <div className="flex items-center gap-2">
                <label htmlFor="lotFilter" className="text-sm font-medium text-gray-700">
                    Lot:
                </label>
                <select
                    id="lotFilter"
                    value={lotFilter}
                    onChange={handleLotFilterChange}
                    className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Lots</option>
                    {[...new Set(users.map((user) => user.lot))].map((lot) => (
                    <option key={lot} value={lot}>
                        {lot}
                    </option>
                    ))}
                </select>
                </div>

                {/* Entries Per Page */}
                <div className="flex items-center gap-2">
                <label htmlFor="entries" className="text-sm font-medium text-gray-700">
                    Show:
                </label>
                <select
                    id="entries"
                    value={entriesPerPage}
                    onChange={handleEntriesPerPageChange}
                    className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
                </div>
            </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto shadow-sm">
            <table className="table-auto w-full text-sm text-left text-gray-800">
              <thead className="text-xs text-gray-900 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Full Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Mobile Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Block</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Lot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">User Role</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                     {currentUsers.map(userOrMember => (
                      <tr key={userOrMember.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                        {
                        userOrMember.firstName 
                            ? // If it's a user
                            `${capitalizeFirstLetter(userOrMember.firstName || "N/A")} 
                            ${userOrMember.middleName || ""} 
                            ${userOrMember.middleInitial || ""} 
                            ${userOrMember.lastName || "N/A"}`
                                .trim()
                            : userOrMember.first_name 
                            ? // If it's a member
                            `${capitalizeFirstLetter(userOrMember.first_name || "N/A")} 
                            ${userOrMember.middle_name || ""} 
                            ${userOrMember.last_name || "N/A"}`
                                .trim()
                            : "N/A"
                        }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        {userOrMember.email ? userOrMember.email : 'Not Provided'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{userOrMember.contact_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{userOrMember.block}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{userOrMember.lot}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{userOrMember.gender}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{computeAge(userOrMember.birthdate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{userOrMember.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-2">
                            <button
                                onClick={() => handleUpdate(userOrMember)}
                                className="bg-[#1D4ED8] text-white p-2 rounded hover:bg-blue-800 text-xs sm:text-base flex items-center transition duration-150 ease-in-out"
                            >
                                <FaEdit className="mr-1" />
                                Update
                            </button>
                            <button
                                onClick={() => handleDelete(userOrMember)}
                                className="bg-[#C81E1E] text-white p-2 rounded hover:bg-red-800 text-xs sm:text-base flex items-center transition duration-150 ease-in-out"
                            >
                                <FaTrash className="mr-1" />
                                Delete
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>


            <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                handlePageChange={handlePageChange}
            />

            {/* Modals */}
            <UserListModal
                  show={showUpdateModal}
                  onClose={() => setShowUpdateModal(false)}
                  onConfirm={handleConfirmUpdate}
                  title={modalTitle}
                  user={selectedUser} 
                  loading={loading}
            />
            <DeleteModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                loading={loading}
                title={modalTitle}
                content={modalContent}
            />
        </div>
    );



};


export default UserList;
