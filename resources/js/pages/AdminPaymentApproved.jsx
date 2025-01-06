import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Breadcrumbs from "../components/Breadcrumbs";
import { getBreadcrumbs } from "../helpers/breadcrumbsHelper";
import { useLocation, useParams } from "react-router-dom";

const AdminPaymentApproved = () => {
  const location = useLocation();
  const crumbs = getBreadcrumbs(location);
  const { type } = useParams();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState(type || "approved");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Default rows per page

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, page, search, rowsPerPage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/${statusFilter}-payments`, {
        params: { page, search, perPage: rowsPerPage },
      });
      setPayments(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      toast.error("Failed to fetch payments.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value)); // Update rows per page
    setPage(1); // Reset to the first page
  };


  const handleApprove = async () => {
    if (!selectedPayment) return toast.error("No payment selected.");
    try {
      const response = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_reference: selectedPayment.transaction_reference,
        }),
      });

      if (response.ok) {
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === selectedPayment.id
              ? { ...payment, is_approved: 1 }
              : payment
          )
        );
        toast.success("Payment approved");
        setIsApproveModalOpen(false);
        fetchPayments(); // Refetch the payments table after approval
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error("Payment approval failed");
    }
  };

  
  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      return toast.error("Please indicate a reason for rejection.");
    }
  
    try {
      const response = await fetch("/api/admin/payments/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_reference: selectedPayment.transaction_reference,
          reject_reason: rejectReason,
        }),
      });
  
      if (response.ok) {
        toast.success("Payment rejected successfully!");
  
        // Remove rejected payment from the current state (Pending)
        setPayments((prev) =>
          prev.filter((payment) => payment.id !== selectedPayment.id)
        );
  
        // Move to Rejected tab
        setStatusFilter("rejected");
        setPage(1); // Reset pagination to first page
        fetchPayments(); // Fetch rejected payments
  
        // Close modal and clear state
        setIsRejectModalOpen(false);
        setRejectReason("");
        setSelectedPayment(null);
      } else {
        toast.error("Failed to reject payment. Please try again.");
      }
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Payment rejection failed.");
    } finally {
      setIsRejecting(false);
    }
  };
  
  

  const handlePrint = () => {
    const printableContent = `
      <html>
      <head>
        <title>Payment Report</title>
        <style>
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              <th>Transaction Reference</th>
              <th>Fee</th>
              <th>Period Covered</th>
              <th>Amount</th>
              <th>Block & Lot</th>
              <th>Payee</th>
              <th>Mode Of Payment</th>
              <th>Transaction Date</th>
              ${statusFilter === "rejected" ? "<th>Rejection Reason</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${payments
              .map(
                (payment) => `
                <tr>
                  <td>${payment.transaction_reference}</td>
                  <td>${payment.fee_name}</td>
                  <td>${payment.period_covered}</td>
                  <td>${payment.amount}</td>
                  <td>Block ${payment.user?.block || "N/A"} Lot ${payment.user?.lot || "N/A"}</td>
                  <td>${
                    payment.user
                      ? `${payment.user.firstName || ""} ${payment.user.lastName || ""}`
                      : "N/A"
                  }</td>
                  <td>${payment.mode_of_payment || "N/A"}</td>
                  <td>${payment.transaction_date || "N/A"}</td>
                  ${
                    statusFilter === "rejected"
                      ? `<td>${payment.reject_reason || "No reason provided"}</td>`
                      : ""
                  }
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
  
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printableContent);
    printWindow.document.close();
    printWindow.print();
  };
  
  const title =
    statusFilter === "rejected"
      ? "Rejected Payments"
      : statusFilter === "pending"
      ? "Pending Payments"
      : "Approved Payments";

  return (
    <div className="p-4">
  <ToastContainer />
  {/* BreadCrumbs Section */}
  <div className="bg-white rounded-md mb-2">
            <Breadcrumbs crumbs={crumbs} />
          </div>

  <h1 className="text-2xl md:text-4xl font-bold mb-6">{title}</h1>

    {/* Filter and Search */}
    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
    {/* Status Filter Buttons */}
    <div className="flex flex-wrap space-x-2">
        {["approved", "rejected", "pending"].map((status) => (
        <button
        key={status}
        onClick={() => setStatusFilter(status)}
        className={`px-4 py-2 text-sm md:text-base rounded-md ${
          statusFilter === status
            ? "bg-orange-500 text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </button>
        ))}
    </div>

        <div>
          <label className="mr-2 text-sm md:text-base">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="border px-4 py-2 rounded-md"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          </div>
        
    <div className="relative w-full md:w-auto">
        {/* Search Icon */}
        <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800"
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

        {/* Input Field */}
        <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            className="border pl-10 pr-4 py-2 rounded-md w-full md:w-auto"
        />
        </div>

    {/* Print Button */}
    <div className="flex  md:ml-auto">
        <button
        onClick={handlePrint}
        className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-sm md:text-base"
        >
        Print Report
        </button>
    </div>
    </div>

  {/* Responsive Table */}
  <div className="overflow-x-auto">
    <table className="table-auto w-full text-sm text-left text-gray-500">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3">
            Transaction Reference
          </th>
          <th scope="col" className="px-6 py-3">
            Fee
          </th>
          <th scope="col" className="px-6 py-3">
            Period Covered
          </th>
          <th scope="col" className="px-6 py-3">
            Amount
          </th>
          <th scope="col" className="px-6 py-3">
            Block
          </th>
          <th scope="col" className="px-6 py-3">
            Lot
          </th>
          <th scope="col" className="px-6 py-3">
            Payee
          </th>
          <th scope="col" className="px-6 py-3">
            Mode of Payment
          </th>
          <th scope="col" className="px-6 py-3">
            Transaction Date
          </th>
          <th scope="col" className="px-6 py-3">
            Proof of Payment
          </th>
          {statusFilter === "rejected" && (
            <th scope="col" className="px-6 py-3">
              Reason
            </th>
          )}
          {statusFilter === "pending" && (
            <th scope="col" className="px-6 py-3">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
  {loading ? (
    <tr>
      <td colSpan={statusFilter === "pending" ? 10 : 11} className="px-6 py-4 text-center">
        Loading...
      </td>
    </tr>
  ) : payments.length > 0 ? (
    payments.map((payment) => (
      <tr key={payment.id} className="bg-white border-b">
        <td className="px-6 py-4">{payment.transaction_reference}</td>
        <td className="px-6 py-4">{payment.fee_name}</td>
        <td className="px-6 py-4">{payment.period_covered}</td>
        <td className="px-6 py-4">PHP {payment.amount}</td>
        <td className="px-6 py-4">{payment.user?.block || "N/A"}</td>
        <td className="px-6 py-4">{payment.user?.lot || "N/A"}</td>
        <td className="px-6 py-4">
          {payment.user
            ? `${payment.user.firstName || ""} ${payment.user.lastName || ""}`
            : "N/A"}
        </td>
        <td className="px-6 py-4">{payment.mode_of_payment || "N/A"}</td>
        <td className="px-6 py-4">{payment.transaction_date || "N/A"}</td>
        <td className="px-6 py-4 ">
          {statusFilter === "approved" && payment.mode_of_payment === "Over the Counter" ? (
            "Not Available"
          ) : (
            <a
              href={`http://localhost:8000/storage/${payment.proof_of_payment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              View
            </a>
          )}
        </td>
        {statusFilter === "rejected" && (
          <td className="px-6 py-4">{payment.reject_reason || "No reason provided"}</td>
        )}
        
        {statusFilter === "pending" && (
          <td className="px-6 py-4">
            <div className="flex justify-center space-x-2">
              <button
                className="bg-green-700 text-white px-3 py-2 rounded-md hover:bg-green-800 text-xs md:text-sm"
                onClick={() => {
                  setSelectedPayment(payment);
                  setIsApproveModalOpen(true);
                }}
              >
                Approve
              </button>
              <button
                className="bg-red-700 text-white  px-3 py-2 rounded-md hover:bg-red-800 text-xs md:text-sm"
                onClick={() => {
                  setSelectedPayment(payment);
                  setIsRejectModalOpen(true);
                }}
              >
                Reject
              </button>
            </div>
          </td>
        )}
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={statusFilter === "pending" ? 11 : 11} className="px-6 py-4 text-center">
        No payments found.
      </td>
    </tr>
  )}
</tbody>
    </table>
  </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
      <button
          onClick={() => handlePageChange(page - 1)}
          className="bg-gray-300 px-4 py-2 rounded-md"
          disabled={page <= 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          className="bg-gray-300 px-4 py-2 rounded-md"
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      {/* Approval Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[999] p-4">
          <div className="bg-white p-6 rounded-md shadow-lg relative w-full max-w-sm">
            {/* Overlay for Approving State */}
            {isApproving && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-10">
                <div className="flex items-center">
                  <svg
                    className="animate-spin h-6 w-6 mr-2 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.963 7.963 0 014 12H2c0 2.21.895 4.21 2.344 5.656l1.414-1.414z"
                    ></path>
                  </svg>
                  <span className="text-green-600 font-medium">Approving...</span>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <h3 className="text-lg font-semibold mb-4">Approve Payment</h3>
            <p>Are you sure you want to approve this payment?</p>

            <div className="mt-4 flex space-x-4">
            <button
                className={`px-4 py-2 rounded-md ${
                  isApproving
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                } text-white`}
                onClick={async () => {
                  setIsApproving(true);
                  await handleApprove();
                  setIsApproving(false);
                }}
                disabled={isApproving}
              >
                {isApproving ? "Approving..." : "Yes, Approve"}
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                onClick={() => setIsApproveModalOpen(false)}
                disabled={isApproving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

     {/* Reject Modal */}
{isRejectModalOpen && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[999] p-4">
    <div className="bg-white p-6 rounded-md shadow-lg min-w-[500px]">
      <h3 className="text-lg font-semibold mb-4">Reject Payment</h3>
      <textarea
        placeholder="Enter reason for rejection"
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        className="w-full p-2 border rounded-md mb-4"
      />
      <div className="mt-4 flex space-x-4">
      <button
          className={`px-4 py-2 rounded-md ${
            isRejecting
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600"
          } text-white`}
          onClick={async () => {
            setIsRejecting(true);
            await handleReject();
            setIsRejecting(false);
          }}
          disabled={isRejecting}
        >
          {isRejecting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.963 7.963 0 014 12H2c0 2.21.895 4.21 2.344 5.656l1.414-1.414z"
                ></path>
              </svg>
              Rejecting...
            </span>
          ) : (
            "Yes, Reject"
          )}
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
          onClick={() => setIsRejectModalOpen(false)}
          disabled={isRejecting}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminPaymentApproved;
