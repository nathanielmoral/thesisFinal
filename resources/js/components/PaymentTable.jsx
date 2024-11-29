import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from 'axios';


const PaymentTable = ({ type }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false); // State for approval process

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/${type}-payments?page=${page}&search=${search}`
        );
        const data = await response.json();
        setPayments(data.data);
        setTotalPages(data.last_page);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchPayments();
  }, [type, page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/${type}-payments?page=${page}&search=${search}`
      );
      const data = await response.json();
      setPayments(data.data);
      setTotalPages(data.last_page);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return toast.error("No payment selected.");

    setIsApproving(true); // Start approving process
    try {
      const response = await fetch("/api/admin/payments/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_reference: selectedPayment.transaction_reference,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === selectedPayment.id
              ? { ...payment, is_approved: 1 }
              : payment
          )
        );
        toast.success(`Payment approved. Period covered: ${result.period_covered}`);
        setIsApproveModalOpen(false);
        fetchPayments(); // Refetch the payments table after approval
      } else {
        toast.error(result.message || "Payment approval failed");
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Payment approval failed");
    } finally {
      setIsApproving(false); // End approving process
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim())
      return toast.error("Please indicate a reason");
  
    setIsRejecting(true); // Start rejecting process
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
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === selectedPayment.id
              ? { ...payment, reject_reason: rejectReason, is_approved: 0 }
              : payment
          )
        );
        toast.success("Payment rejected");
        setIsRejectModalOpen(false);
        setRejectReason("");
        fetchPayments(); // Refetch the payments table after rejection
      } else {
        toast.error("Payment rejection failed");
      }
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Payment rejection failed");
    } finally {
      setIsRejecting(false); // End rejecting process
    }
  };


  const handlePrint = async () => {
    try {
        const response = await axios.get('/api/monthly-payments/print-approved');
        const allPayments = response.data;

        // Open a new print window
        const printWindow = window.open('', '_blank');
        const printableContent = `
            <html>
            <head>
                <title>Approved Payments</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; font-weight: bold; }
                    h1 { text-align: center; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>Approved Payments</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Transaction Reference</th>
                            <th>Period Covered</th>
                            <th>Amount</th>
                            <th>Payer Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allPayments
                          .map(payment => `
                            <tr>
                              <td>${payment.transaction_reference}</td>
                              <td>${payment.period_covered}</td>
                              <td>PHP ${payment.amount}</td>
                              <td>${payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : "No User"}</td>
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
    } catch (error) {
        console.error("Error fetching approved payments:", error.response?.data || error.message);
        toast.error(
            `Failed to fetch approved payments: ${
                error.response?.data?.message || error.message
            }`
        );
    }
};

  if (loading && !search) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div>
        {/* Search */}
        <div className="mb-4 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search by transaction reference or user"
            value={search}
            onChange={handleSearchChange}
            className="flex-1 px-4 py-2 border rounded-md shadow-sm"
          />
          {type === "approved" && ( // Render the Print button only for approved type
            <button
              onClick={handlePrint}
              className="ml-4 bg-green-700 text-white px-4 py-2 rounded shadow hover:bg-green-500 transition flex items-center"
            >
              <svg
                className="w-5 h-5 text-white mr-2"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M8 3a2 2 0 0 0-2 2v3h12V5a2 2 0 0 0-2-2H8Zm-3 7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1v-4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4h1a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5Zm4 11a1 1 0 0 1-1-1v-4h8v4a1 1 0 0 1-1 1H9Z"
                  clipRule="evenodd"
                />
              </svg>
              Print
            </button>
          )}
        </div>
      </div>

      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold">
              Transaction Reference
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold">
              Period Covered
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold">Amount</th>
            <th className="px-4 py-2 text-left text-sm font-semibold">
              Proof of Payment
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold">User</th>
            {type === "rejected" && (
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Reject Reason
              </th>
            )}
            {type === "pending" && (
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <tr key={payment.id} className="border-t">
                <td className="px-4 py-2 text-sm">
                  {payment.transaction_reference}
                </td>
                <td className="px-4 py-2 text-sm">{payment.period_covered}</td>
                <td className="px-4 py-2 text-sm">PHP {payment.amount}</td>
                <td className="px-4 py-2 text-sm">
                  <a
                    href={`http://localhost:8000/storage/${payment.proof_of_payment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-500 hover:underline"
                  >
                    View
                  </a>
                </td>
                <td className="px-4 py-2 text-sm">
                  {payment.user
                    ? `${payment.user.firstName || "Unknown"} ${payment.user.lastName || ""}`
                    : "No User"}
                </td>
                {type === "pending" && payment.is_approved === 0 && (
                  <td className="px-4 py-2 text-sm">
                    <div className="flex space-x-2">
                      <button
                        className="px-4 py-2 bg-green-500 text-white rounded-md"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsApproveModalOpen(true);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="px-4 py-2 bg-red-700 text-white rounded-md"
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
                {type === "rejected" && (
                  <td className="px-4 py-2 text-sm">{payment.reject_reason}</td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={type === "approved" ? "5" : "6"}
                className="text-center px-4 py-2 text-sm"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between items-center">
        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      {/* Approval Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[999] p-4">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Approve Payment</h3>
            <p>Are you sure you want to approve this payment?</p>
            <div className="mt-4 flex space-x-4">
              <button
                className={`px-4 py-2 rounded-md ${
                  isApproving
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-green-500"
                } text-white`}
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
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
                    Approving...
                  </span>
                ) : (
                  "Yes, Approve"
                )}
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
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
              : "bg-red-500 text-white"
          }`}
          onClick={handleReject}
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

export default PaymentTable;
