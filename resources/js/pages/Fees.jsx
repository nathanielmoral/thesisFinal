import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", description: "", amount: "" });
  const [accountNumber, setAccountNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch fees and Gcash settings on mount
  useEffect(() => {
    fetchFees();
    fetchSettings();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await axios.get("/api/fees");
      setFees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching fees:", error);
      toast.error("Failed to fetch fees.");
    }
  };

  const fetchSettings = async () => {
    try {
        const response = await axios.get(`/api/settings`);
        console.log('Fetched Settings:', response.data); // Debug the response
        setAccountNumber(response.data.account_number || ""); // Default to empty if null
    } catch (error) {
        console.error("Error fetching settings:", error);
        if (error.response) {
            console.error("API Error Response:", error.response.data);
        }
        toast.error("Failed to fetch settings.");
    }
};


const updateSettings = async (e) => {
    e.preventDefault();
    try {
        await axios.post(`/api/settings/update`, {
            account_number: accountNumber,
        });
        toast.success("Gcash Number have been updated successfully.");
    } catch (error) {
        console.error("Error updating settings:", error);
        toast.error("Failed to update settings.");
    }
};

  const handleSave = async (e) => {
    e.preventDefault();
    const updatedForm = { ...form, amount: parseFloat(form.amount) };

    try {
      if (isEditing) {
        const response = await axios.put(`/api/fees/${form.id}`, updatedForm);
        setFees((prevFees) =>
          prevFees.map((fee) => (fee.id === form.id ? response.data : fee))
        );
        toast.success("Fee updated successfully.");
      } else {
        const response = await axios.post("/api/fees/add", updatedForm);
        setFees((prevFees) => [...prevFees, response.data]);
        toast.success("Fee added successfully.");
      }
      resetForm();
    } catch (error) {
      console.error("Error saving fee:", error.response || error);
      toast.error("Failed to save fee.");
    }
  };

  const resetForm = () => {
    setForm({ id: null, name: "", description: "", amount: "" });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleEdit = (fee) => {
    setForm(fee);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (fee) => {
    setFeeToDelete(fee);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!feeToDelete) return;
    try {
      await axios.delete(`/api/fees/${feeToDelete.id}`);
      setFees((prevFees) => prevFees.filter((fee) => fee.id !== feeToDelete.id));
      toast.success("Fee deleted successfully.");
    } catch (error) {
      console.error("Error deleting fee:", error.response || error);
      toast.error("Failed to delete fee.");
    } finally {
      setIsDeleteModalOpen(false);
      setFeeToDelete(null);
    }
  };

  const handleAssignFees = (fees) => {
    navigate("/assignfee", { state: { fees } });
  };

  const filteredFees = fees.filter((fee) =>
    fee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Manage Fees</h1>

              {/* Gcash Account Number Section */}
            <div className="bg-white p-4  mb-6">
              <h2 className="text-xl font-bold mb-2">Gcash Account Settings</h2>
              
              <form onSubmit={updateSettings} className="space-y-4">
                <div>
                  <label htmlFor="accountNumber" className="block text-gray-700 font-medium">
                    Gcash Account Number
                  </label>
                  {/* The input field displays the current account number and allows direct editing */}
                  <input
                    type="text"
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Enter Gcash account number"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 flex items-center rounded hover:bg-blue-700"
                >
                  <FaEdit className="mr-1" />
                  Update
                </button>
              </form>
            </div>



      {/* Search and Button Section */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search fees"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex items-center"
          >
            Add Fee
          </button>
          <button
            onClick={() => handleAssignFees(fees)}
            className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 flex items-center"
          >
            Assign Fee
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
      <table className="table-auto w-full text-sm text-center text-gray-500">
       <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFees.map((fee) => (
              <tr key={fee.id}>
                <td className="px-6 py-4 whitespace-nowrap">{fee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.description || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">PHP {fee.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                  <button
                      onClick={() => handleEdit(fee)}
                      className=" bg-blue-700 text-white p-2 rounded hover:bg-blue-800 text-xs sm:text-base flex transition duration-150 ease-in-out"
                    >
                      <FaEdit className="mr-1" />
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteClick(fee)}
                      className=" bg-red-700 text-white p-2 rounded hover:bg-red-800 text-xs sm:text-base flex items-center transition duration-150 ease-in-out"
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

      {/* Confirm Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h2 className="text-lg font-bold mb-4 justify-center  ">Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the fee <strong>{feeToDelete?.name}</strong>?
              This action will affect all assigned fees.
            </p>
            <div className="flex justify-between mt-4 space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Fee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-1/2">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Update Fee" : "Add Fee"}
            </h2>
            <form onSubmit={handleSave}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mb-2 p-2 border border-gray-300 rounded w-full"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mb-2 p-2 border border-gray-300 rounded w-full"
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                className="mb-2 p-2 border border-gray-300 rounded w-full"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {isEditing ? "Save" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
