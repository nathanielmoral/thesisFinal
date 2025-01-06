import React, { useState, useEffect } from "react";
import axios from "axios";
import { MultiSelect } from "react-multi-select-component";
import { useNavigate } from "react-router-dom";
import { FaEye } from 'react-icons/fa';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const AssignFeeForm = () => {
  const [fees, setFees] = useState([]);
  const [accountHolders, setAccountHolders] = useState([]);
  const [assignedFees, setAssignedFees] = useState([]);
  const [blockFilter, setBlockFilter] = useState(""); // State for Block Filter
  const [lotFilter, setLotFilter] = useState(""); // State for Lot Filter
  const [formData, setFormData] = useState({
    fee_id: "",
    account_holder_id: [],
    months: [],
    year: new Date().getFullYear(),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [months] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      label: new Date(0, i).toLocaleString("default", { month: "long" }),
      value: i + 1,
    }))
  );
  const [isAssignFeeModalOpen, setIsAssignFeeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [itemsPerPage] = useState(10); // Number of items per page
  


  // Fetch all assigned fees
  useEffect(() => {
    const fetchAllFees = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/fees/all");
        if (Array.isArray(response.data)) {
          setAssignedFees(response.data);
        } else {
          setAssignedFees([]);
          console.error("Expected an array but got:", response.data);
        }
      } catch (err) {
        console.error("Error fetching assigned fees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAccountHoldersChange = (selectedOptions) => {
    const selectedIds = selectedOptions.map((option) => option.value);
    setFormData({ ...formData, account_holder_id: selectedIds });
  };
  

  const handleMonthsChange = (selectedOptions) => {
    const selectedMonths = selectedOptions.map((option) => option.value);
    setFormData({ ...formData, months: selectedMonths });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("/api/fees/assign", formData);
      toast.success(response.data.message || "Fee assigned successfully!");
      setFormData({
        fee_id: "",
        account_holder_id: [],
        months: [],
        year: new Date().getFullYear(),
      });
      setIsAssignFeeModalOpen(false); // Close modal on success
    } catch (err) {
      toast.error("Failed to assign the fee.");
      console.error("Error assigning fee:", err);
    }
  };
  // Fetch available fees
  useEffect(() => {
    axios
      .get("/api/fees")
      .then((response) => {
        setFees(response.data);
      })
      .catch((err) => {
        console.error("Error fetching fees:", err);
        toast.warn("Failed to load fee types. Please try again.");
      });
  }, []);

  // Fetch account holders
  useEffect(() => {
    const fetchAccountHolders = async () => {
      try {
        const response = await axios.get("/api/fetch-account-holders");
        const allAccountHolders = response.data;
  
        // Filter out account holders with already assigned fees
        const filteredAccountHolders = allAccountHolders.filter((accountHolder) => {
          return !assignedFees.some(
            (fee) =>
              fee.fee_id === formData.fee_id && // Match selected fee
              fee.accountHolder?.id === accountHolder.id && // Same account holder
              fee.accountHolder?.block === accountHolder.block && // Same block
              fee.accountHolder?.lot === accountHolder.lot // Same lot
          );
        });
  
        setAccountHolders(filteredAccountHolders);
      } catch (err) {
        console.error("Error fetching account holders:", err);
        toast.error("Failed to load account holders. Please try again.");
      }
    };
  
    // Fetch only when fee_id is selected
    if (formData.fee_id) {
      fetchAccountHolders();
    }
  }, [formData.fee_id, assignedFees]);
  

 // Aggregate fees per account holder
// Aggregate fees per account holder
const aggregatedFees = assignedFees.reduce((acc, fee) => {
    const accountKey = fee.accountHolder
      ? ` ${fee.accountHolder.firstName} ${fee.accountHolder.middleName || ""} ${fee.accountHolder.lastName}`
      : "Unknown";

    if (!acc[accountKey]) {
      acc[accountKey] = {
        account_number: fee.accountHolder?.account_number || "N/A", // Add this line
        fullName: accountKey,
        block: fee.accountHolder?.block || "N/A",
        lot: fee.accountHolder?.lot || "N/A",
        totalAmount: 0,
        fees: [],
        userId: fee.accountHolder?.id || null, // Include userId
      };
    }

    // Safely check if fee.fee exists and has amount
    const feeAmount = fee.fee?.amount ? parseFloat(fee.fee.amount) : 0;

    acc[accountKey].totalAmount += feeAmount;
    acc[accountKey].fees.push(fee);

    return acc;
  }, {});

  const aggregatedList = Object.values(aggregatedFees);

  // Filtered List Logic
  const filteredList = aggregatedList.filter((account) => {
    const matchesBlock = blockFilter ? account.block?.toString() === blockFilter.toString() : true;
    const matchesLot = lotFilter ? account.lot?.toString() === lotFilter.toString() : true;    
    const matchesSearch = account.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBlock && matchesLot && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedData = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = (userId) => {
    if (!userId) {
      alert("User ID is missing!");
      return;
    }
    navigate(`/users/${userId}/fees`);
  };

  return (
    <div className=" min-h-screen relative overflow-x-auto shadow-md sm:rounded-md p-4 bg-[#FAFAFA]">
      <ToastContainer />
            <h1 className="text-4xl font-bold mb-4">Assigned Fees</h1>

    {/* Filter Section */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-1/2">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
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
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-indigo-300"
          />
        </div>

        {/* Block Filter */}
        <select
      value={blockFilter}
      onChange={(e) => setBlockFilter(e.target.value)}
      className="border p-2 rounded-lg"
    >
      <option value="">Filter by Block</option>
      {Array.from(new Set(aggregatedList.map((account) => account.block))).map((block) => (
        <option key={block} value={block}>
          Block {block}
        </option>
      ))}
    </select>

    <select
      value={lotFilter}
      onChange={(e) => setLotFilter(e.target.value)}
      className="border p-2 rounded-lg"
    >
      <option value="">Filter by Lot</option>
      {Array.from(new Set(aggregatedList.map((account) => account.lot))).map((lot) => (
        <option key={lot} value={lot}>
          Lot {lot}
        </option>
      ))}
    </select>

        {/* Assign Fee Button */}
        <button
          onClick={() => setIsAssignFeeModalOpen(true)}
          className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 flex items-center"
        >
          Assign Fee
        </button>
      </div>


    <div className="overflow-x-auto  shadow-sm">
    <table className="table-auto w-full text-sm text-center text-gray-500">
    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
               Account Number
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Block
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lot
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount (PHP)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {filteredList.length > 0 ? (
              filteredList.map((account, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{account.account_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{account.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{account.block}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{account.lot}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ₱{account.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4  whitespace-nowrap text-center">
                  <button
                        onClick={() => handleViewDetails(account.userId)}
                        className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex items-center"
                        >
                       <FaEye className="mr-1"/>
                        View
                 </button>
                </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No assigned fees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
     </div>

     
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className={`px-4 py-2 rounded-md ${currentPage <= 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className={`px-4 py-2 rounded-md ${currentPage >= totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"}`}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div> 

     {isAssignFeeModalOpen  && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Assign Fee to Account Holder</h2>
              {message && (
                <div className="mb-4 p-3 text-white bg-green-500 rounded">{message}</div>
              )}
              {error && (
                <div className="mb-4 p-3 text-white bg-red-500 rounded">{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="fee_id"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Fee Type
                  </label>
                  <select
                    name="fee_id"
                    id="fee_id"
                    value={formData.fee_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a Fee</option>
                    {fees.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        {fee.name} - ₱{parseFloat(fee.amount || "0").toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="account_holder_id"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Account Holders
                  </label>
                  <MultiSelect
                    options={accountHolders.map((user) => ({
                      label: `${user.firstName} ${user.lastName} (Block: ${user.block}, Lot: ${user.lot})`,
                      value: user.id,
                    }))} // Use filtered list
                    value={accountHolders
                      .filter((user) => formData.account_holder_id.includes(user.id))
                      .map((user) => ({
                        label: `${user.firstName} ${user.lastName} (Block: ${user.block}, Lot: ${user.lot})`,
                        value: user.id,
                      }))}
                    onChange={handleAccountHoldersChange}
                    labelledBy="Select Account Holders"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="months"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Months
                  </label>
                  <MultiSelect
                    options={months}
                    value={months.filter((month) =>
                      formData.months.includes(month.value)
                    )}
                    onChange={handleMonthsChange}
                    labelledBy="Select Months"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    id="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                    onClick={() => setIsAssignFeeModalOpen (false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md"
                  >
                    Assign Fee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>


  );
};

export default AssignFeeForm;
