import React, { useState,useEffect } from "react";
import { fetchUserDetails } from '../api/user';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from 'react-icons/fa';

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    id: null,
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    birthdate: "",
    contactNumber: "",
    block: "", // Initialize as empty string
    lot: "", // Initialize as empty string
    blockAndLot: "", // Optional combined field
    gender: "",
    username: "",
    nameOfOwner: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({});
  const [errors, setErrors] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [ownedBlocksLots, setOwnedBlocksLots] = useState([]);

      
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
          }
      };
  
      useEffect(() => {
          if (userId) {
              fetchOwnedBlocksLots();
          }
      }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "block" || name === "lot") {
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value,
        blockAndLot: name === "block"
          ? `${value},${prevForm.lot}`
          : `${prevForm.block},${value}`,
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };
  
  
  const validateForm = () => {
    const { firstName, lastName, birthdate, contactNumber, gender,email,block, lot} = form;
    const newErrors = {};
  
    // Check required fields
    if (!firstName.trim()) {
      toast.error("First Name is required.");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Last Name is required.");
      return false;
    }
    if (!birthdate) {
      toast.error("Birthdate is required.");
      return false;
    }
  // Check if contact number is empty
  if (!contactNumber.trim()) {
    newErrors.contactNumber = "Contact Number is required.";
  } else {
    // Validate Philippine contact number format
    const mobileRegex = /^(09\d{9}|(\+639)\d{9})$/;

    if (!mobileRegex.test(contactNumber)) {
      newErrors.contactNumber =
        "Invalid contact number. Please use the format '09XXXXXXXXX' or '+639XXXXXXXXX'.";
    }
  }
    if (!gender) {
      toast.error("Gender is required.");
      return false;
    }

      // Validate email only if provided
      if (email && typeof email === "string" && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
        newErrors.email = "Invalid email format.";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchUserData = async () => {
    try {
        const data = await fetchUserDetails();
        if (data && data.id) {
            setUser(data); // Save the authenticated user data
            setUserId(data.id);
            fetchMembers(data.id); // Fetch members linked to this user
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


const fetchMembers = async (userId) => {
  try {
      const response = await fetch(`/api/user/member/get/${userId}`);
      const data = await response.json();

      if (response.ok) {
          console.log('Fetched Members:', data.data);
          setMembers(data.data);
          setTotalPages(data.last_page);
      } else {
          toast.error(data.message || 'Failed to fetch members');
      }
  } catch (error) {
      console.error('Error fetching members:', error);
  }
};

useEffect(() => {
  if (userId) {
    fetchMembers(userId);
  }
}, [userId]);


  
const handleAddOrUpdateMember = async () => {
  if (!validateForm()) return; // Ensure the form is valid before proceeding.

  const method = form.id ? "PUT" : "POST"; // Determine the HTTP method (PUT for update, POST for add).
  const url = form.id
  ? `/api/user/members/${form.id}` // Endpoint for updating a member.
  : "/api/user/members/new"; // Endpoint for adding a new member.

  setIsLoading(true); // Show loading state during API call.

  try {
    const memberData = {
      ...form,
      role: form.role || "Renter", // Default role
      family_id: user.family_id, // Automatically include family_id
    };

    // Only include block and lot if the user is a Homeowner
    if (user.role === "Homeowner") {
      if (!form.block || !form.lot) {
        toast.error("Please select a valid Block and Lot.");
        setIsLoading(false); // Stop loading if validation fails
        return;
      }
      memberData.block = form.block;
      memberData.lot = form.lot;
    }

      // Automatically assign block and lot for renters
      if (user.role === "Renter") {
        memberData.block = user.block;
        memberData.lot = user.lot;
      }

    // Generate username and owner name if adding a new member
    if (method === "POST") {
      memberData.username = `${form.firstName}${form.middleName || ""}${form.lastName}${memberData.block || ""}${memberData.lot || ""}`
        .replace(/\s+/g, "")
        .toLowerCase();
      memberData.nameOfOwner = `${user.firstName} ${user.lastName}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    if (response.ok) {
      toast.success(
        method === "PUT"
          ? "Member updated successfully!"
          : "Member added successfully!"
      );
      resetForm();
      setShowModal(false);
      setIsEditing(false);
      await fetchMembers(userId); // Refresh the members list
    } else {
      const errorData = await response.json();
      if (errorData.error) {
        setErrors(errorData.error);
        Object.entries(errorData.error).forEach(([key, messages]) => {
          toast.error(`${key}: ${messages.join(", ")}`);
        });
      } else {
        toast.error(errorData.message || "Failed to process the request.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    toast.error("An error occurred while processing the request.");
  } finally {
    setIsLoading(false);
  }
};


// Helper function to reset the form
const resetForm = () => {
  setForm({
    id: null,
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    birthdate: "",
    contactNumber: "",
    gender: "",
    block: "",
    lot: "",
    blockAndLot: "",
    username: "",
    nameOfOwner: "",
    role: "Renter",
    family_id: null,
  });
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

const handleEditMember = (id) => {
  const memberToEdit = members.find((member) => member.id === id);

  // Set form state with all required fields, including any optional fields
  setForm({
    id: memberToEdit.id,
    firstName: memberToEdit.firstName || "",
    middleName: memberToEdit.middleName || "",
    lastName: memberToEdit.lastName || "",
    email: memberToEdit.email || "",
    birthdate: memberToEdit.birthdate || "",
    contactNumber: memberToEdit.contact_number || "",
    gender: memberToEdit.gender || "",
    nameOfOwner: memberToEdit.nameOfOwner || "", // Prepopulate missing fields
    username: memberToEdit.username || "", // Prepopulate missing fields
    block: memberToEdit.block || "", // Prepopulate missing fields
    lot: memberToEdit.lot || "", // Prepopulate missing fields
  });

  setIsEditing(true);
  setShowModal(true);
};

const handleDeleteConfirmed = async () => {
  if (!selectedMemberId) return;

  try {
    const response = await fetch(`/api/user/members/${selectedMemberId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setMembers((prev) => prev.filter((member) => member.id !== selectedMemberId));
      toast.success("Member deleted successfully!");
    } else {
      toast.error("Failed to delete member.");
    }
  } catch (error) {
    console.error("Error deleting member:", error);
    toast.error("An error occurred while deleting the member.");
  } finally {
    setIsDeleteModalOpen(false); // Close the modal
    setSelectedMemberId(null); // Reset selected member
  }
};


  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.first_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (member.last_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
  
    const matchesBlock = selectedBlock ? member.block === selectedBlock : true;
    const matchesLot = selectedLot ? member.lot === selectedLot : true;
  
    return matchesSearch && matchesBlock && matchesLot;
  });

  return (
    <div className="p-4 md:p-6">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-4 text-center md:text-left">
          Member Management 
      </h2>  
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input w-full pl-12 py-2 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* Block Filter */}
        <div className="flex gap-4 ">
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="border p-2 rounded-md"
          >
            <option value="">Filter by Block</option>
            {Array.from(new Set(members.map((member) => member.block || "N/A"))).map(
              (block, index) => (
                <option key={index} value={block}>
                  {block}
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
            {Array.from(new Set(members.map((member) => member.lot || "N/A"))).map(
              (lot, index) => (
                <option key={index} value={lot}>
                  {lot}
                </option>
              )
            )}
          </select>
        </div>

        {/* Add Member Button */}

          <button
            onClick={() => {
              setForm({
                id: null,
                firstName: "",
                middleName: "",
                lastName: "",
                email: "",
                birthdate: "",
                contactNumber: "",
                gender: "",
                username: "",
                nameOfOwner: "",
                role: "Renter",
                family_id: null,
              });
              setIsEditing(false); // Ensure editing mode is off
              setShowModal(true); // Open the modal
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Member
          </button>

      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
           <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Full Name</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Block</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Lot</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Contact Number</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Birthdate</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {`${member.firstName || "N/A"} ${member.middleName || ""} ${member.lastName || "N/A"}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{member.email || "Not Provided"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{member.block || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{member.lot || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{member.contact_number || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{member.birthdate || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{computeAge(member.birthdate) || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{member.gender || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditMember(member.id)}
                        className="px-3 py-1 bg-yellow-500 flex items-center text-white text-sm rounded-md hover:bg-yellow-600"
                      >
                        <FaEdit className="mr-1"/>
                        Update
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMemberId(member.id);
                          setIsDeleteModalOpen(true); // Open the confirmation modal
                        }}
                        className="px-3 py-1 bg-red-600 flex items-center text-white text-sm rounded-md hover:bg-red-700"
                      >
                        <FaTrash className="mr-1"/>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center px-6 py-4 text-sm text-gray-500">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">
              {isEditing ? "Edit Member" : "Add New Member"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleInputChange}
                  className="border p-2 rounded-md w-full"
                  required
                />
              </div>

              {/* Middle Name */}
              <div>
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  id="middleName"
                  type="text"
                  name="middleName"
                  value={form.middleName}
                  onChange={handleInputChange}
                  className="border p-2 rounded-md w-full"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className="border p-2 rounded-md w-full"
                  required
                />
              </div>

              {/* Birthdate */}
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                  Birthdate
                </label>
                <input
                  id="birthdate"
                  type="date"
                  name="birthdate"
                  value={form.birthdate}
                  onChange={handleInputChange}
                  className="border p-2 rounded-md w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email (optional)
                </label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email || ""}
                    onChange={handleInputChange}
                    className={`border p-2 rounded-md w-full ${
                        errors.email ? "border-red-700" : "border-gray-600"
                    }`}
                />
                {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
            </div>


              {/* Contact Number */}
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  id="contactNumber"
                  type="text"
                  name="contactNumber"
                  value={form.contactNumber || ""}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${
                      errors.contactNumber ? "border-red-700" : "border-gray-500"
                  }`}
                  required
                />
                {errors.contactNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactNumber}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                  className="border p-2 rounded-md w-full"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                {user.role === "Homeowner" && ( // Only show this field if the user is a Homeowner
                  <div>
                    <label htmlFor="blockAndLot" className="block text-sm font-medium text-gray-700">
                      Block and Lot
                    </label>
                    <select
                      id="blockAndLot"
                      name="blockAndLot"
                      value={`${form.block},${form.lot}`} // Combine block and lot as the value
                      onChange={(e) => {
                        const [block, lot] = e.target.value.split(","); // Split the selected value
                        setForm((prevForm) => ({
                          ...prevForm,
                          block,
                          lot,
                        }));
                      }}
                      className="border p-2 rounded-md w-full"
                      required
                    >
                      <option value="">Select Block and Lot</option>
                      {ownedBlocksLots.map((blockLot) => (
                        <option key={`${blockLot.block}-${blockLot.lot}`} value={`${blockLot.block},${blockLot.lot}`}>
                          Block {blockLot.block}, Lot {blockLot.lot}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>


            </div>

        
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="mr-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateMember}
                className={`px-4 py-2 rounded-md ${
                  isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
                disabled={isLoading} // Disable the button during loading
              >
                {isEditing ? (isLoading ? "Updating..." : "Update Member") : isLoading ? "Adding..." : "Add Member"}
              </button>

            </div>
          </div>
        </div>
      )}


      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">Confirm Deletion</h2>
            <p className="text-center text-gray-600">
              Are you sure you want to delete this member? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedMemberId(null); // Cancel deletion
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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

export default MemberManagement;
