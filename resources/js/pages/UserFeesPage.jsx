import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BeatLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {  FaTrash } from 'react-icons/fa';

const UserFees = () => {
  const { userId } = useParams();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(""); // Filter by year
  const [status, setStatus] = useState(""); // Filter by status
  const [pagination, setPagination] = useState({}); // Pagination info
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/users/${userId}/fees`, {
        params: {
          year: year || undefined,
          status: status || undefined,
          page: currentPage,
          per_page: 12,
        },
      });

      if (response.status === 200) {
        setFees(response.data.data); // Paginated data
        setPagination({
          total: response.data.total,
          perPage: response.data.per_page,
          currentPage: response.data.current_page,
          lastPage: response.data.last_page,
        });
      } else {
        setFees([]);
        setError(response.data.message || "No fees found for this user.");
      }
    } catch (err) {
      setError("Failed to fetch fees. Please try again.");
      console.error("Error fetching fees:", err);
    } finally {
      setLoading(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const deleteFee = async () => {
    if (!selectedFee) return;
    try {
      const response = await axios.delete(`/api/user/fees/${selectedFee.id}`);
      toast.success(response.data.message || "The fee record was successfully deleted.");
      setModalOpen(false);
      fetchFees();
    } catch (error) {
      console.error("Error deleting fee:", error);
      if (error.response?.status === 404) {
        toast.error("The fee record was not found. It may have already been deleted.");
      } else {
        toast.error("Failed to delete the fee. Please try again.");
      }
    }
  };


  useEffect(() => {
    if (userId) {
      fetchFees();
    } else {
      setError("User ID is missing in the URL.");
      setLoading(false);
    }
  }, [userId, year, status, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-100 flex justify-center items-center">
        <BeatLoader color="#4A90E2" size={15} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-100 flex justify-center items-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <ToastContainer />
      <h1 className="text-3xl font-semibold mb-6">
        Fee Details for{" "}
        {fees.length > 0
            ? `Block ${fees[0].accountHolder?.block || ""} Lot ${fees[0].accountHolder?.lot || ""}`.trim()
            : "Unknown"}
        </h1>


      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Years</option>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(
            (year) => (
              <option key={year} value={year}>
                {year}
              </option>
            )
          )}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Fees Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Fee Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fees.map((fee, index) => (
              <tr key={index}>
                <td className="px-6 py-4">{fee.fee?.name || "N/A"}</td>
                <td className="px-6 py-4">{fee.fee?.description || "N/A"}</td>
                <td className="px-6 py-4">₱{fee.fee?.amount || "0.00"}</td>
                <td className="px-6 py-4">
                {fee.payment_status === "Paid" ? (
                    <span className="text-green-600 font-semibold">Paid</span>
                  ) : (
                    <span className="text-red-700 font-semibold">Unpaid</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {new Date(0, fee.month - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </td>
                <td className="px-6 py-4">{fee.year || "N/A"}</td>
                <td className="px-6 py-4">
                    <button
                        onClick={() => {
                        setSelectedFee(fee); // Ensure `fee.id` is the `BlockLotFee` ID
                        setModalOpen(true);
                        }}
                        className="bg-red-600 text-white p-2 rounded hover:bg-red-700 text-xs sm:text-base flex items-center transition duration-150 ease-in-out"
                    >
                        < FaTrash className="mr-1"/>
                        Delete
                    </button>
                    </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={pagination.currentPage === 1}
          className="bg-gray-300 px-4 py-2 rounded-lg"
        >
          Previous
        </button>
        <span>
          Page {pagination.currentPage} of {pagination.lastPage}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, pagination.lastPage))
          }
          disabled={pagination.currentPage === pagination.lastPage}
          className="bg-gray-300 px-4 py-2 rounded-lg"
        >
          Next
        </button>
      </div>

      {/* Delete Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
              <p>
                Are you sure you want to delete the fee
                <strong> {selectedFee?.fee?.name}</strong>?
              </p>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                onClick={deleteFee}
                disabled={deleting}
                className={`${
                    deleting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                } text-white px-4 py-2 rounded-lg`}
                >
                {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFees;
