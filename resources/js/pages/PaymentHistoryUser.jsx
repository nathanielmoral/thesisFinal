import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchUserDetails } from "../api/user";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ViewProofModal from "../components/ViewProofModal";

const PaymentHistoryUser = () => {
  const [loading, setLoading] = useState(true);
  const [approvedPayments, setApprovedPayments] = useState([]);
  const [rejectedPayments, setRejectedPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("approved");
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // Initially null
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const [totalPages, setTotalPages] = useState(1); // Track the total number of pages
  
  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      // Use correct endpoints for approved and rejected payments
      const approvedResponse = await axios.get("/api/approved/payments/user", {
        params: { user_id: userId, page }, // Send the page parameter
      });
      const rejectedResponse = await axios.get("/api/rejected/payments/user", {
        params: { user_id: userId },
      });
  
      setApprovedPayments(approvedResponse.data.data || []); // Update approved payments
      setRejectedPayments(rejectedResponse.data.data || []); // Update rejected payments
      setCurrentPage(approvedResponse.data.data.current_page || 1); // Update current page
    setTotalPages(approvedResponse.data.data.last_page || 1);
    } catch (error) {
      console.error("Error fetching payments:", error.response?.data || error.message);
      toast.error("Failed to fetch payment history.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user details to set the userId
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDetails = await fetchUserDetails();
        setUser(userDetails);
        setUserId(userDetails.id || null);
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Failed to fetch user details.");
      }
    };
    fetchData();
  }, []);

  // Fetch payments whenever userId changes
  useEffect(() => {
    if (userId) {
      fetchPayments();
  }
  }, [userId]);


  const capitalize = (str) => {
    return str
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : "";
  };
    
  const openProofModal = (url) => {
    const imageUrl = `http://localhost:8000/storage/${url}`;
    setProofUrl(imageUrl);
    setShowProofModal(true);
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setProofUrl("");
  };


  return (
    <div className="max-h-full overflow-y-auto p-2">
      <ToastContainer />
      <ViewProofModal
        isOpen={showProofModal}
        onClose={closeProofModal}
        proofUrl={proofUrl}
      />

      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h1 className="text-2xl md:text-4xl font-bold mb-4">Payment History</h1>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div>
            {/* Tab Buttons */}
            <div className="flex mb-4">
              <button
                className={`px-4 py-2 mr-6 transition ${
                  activeTab === "approved"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("approved")}
              >
                Paid
              </button>
              <button
                className={`px-4 py-2 transition ${
                  activeTab === "rejected"
                    ? "border-b-2 border-red-500 text-red-600 font-medium"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("rejected")}
              >
                Rejected
              </button>
            </div>

            {/* Conditional Rendering */}
            {activeTab === "approved" ? (
              <div>
              <table className="table-auto w-full text-sm text-center text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-center">Transaction Ref</th>
                    <th className="px-2 py-3 text-center">Fee</th>
                    <th className="px-2 py-3 text-center">Period Covered</th>
                    <th className="px-2 py-3 text-center">Payee</th>
                    <th className="px-2 py-3 text-center">Block</th>
                    <th className="px-2 py-3 text-center">Lot</th>
                    <th className="px-2 py-3 text-center">Amount Due</th>
                    <th className="px-2 py-3 text-center">Amount Paid</th>
                    <th className="px-2 py-3 text-center">Mode of Payment</th>
                    <th className="px-2 py-3 text-center">Transaction Date</th>
                    <th className="px-2 py-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedPayments.length > 0 ? (
                    approvedPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 border-b">
                        <td className="px-2 py-2 text-left">
                          {payment.transaction_reference}
                        </td>
                        <td className="px-2 py-2 text-left">{payment.fee_name}</td>
                        <td className="px-2 py-2 text-center">{payment.period_covered}</td>
                        <td className="px-2 py-2 text-left">
                          {payment.user
                            ? `${capitalize(payment.user.firstName || "")} ${capitalize(
                                payment.user.lastName || ""
                              )}`
                            : "N/A"}
                        </td>
                        <td className="px-2 py-2 text-left">{payment.user?.block}</td>
                        <td className="px-2 py-2 text-left">{payment.user?.lot}</td>
                        <td className="px-2 py-2 text-center">
                          {payment.fees
                            ? `PHP ${payment.fees
                                .reduce((sum, fee) => sum + parseFloat(fee.amount_paid), 0)
                                .toFixed(2)}`
                            : "N/A"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          PHP {parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-2 py-2">{payment.mode_of_payment}</td>
                        <td className="px-2 py-2">{payment.transaction_date}</td>
                        <td className="px-2 py-2 text-center">
                          {payment.mode_of_payment === "Over the Counter" ? (
                            payment.proof_of_payment ? (
                              <button
                                onClick={() => openProofModal(payment.proof_of_payment)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                View Receipt
                              </button>
                            ) : (
                              <span className="text-gray-500">Not Available</span>
                            )
                          ) : payment.proof_of_payment ? (
                            <button
                              onClick={() => openProofModal(payment.proof_of_payment)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center py-4">
                        No approved payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className={`px-4 py-2 rounded-md ${
                      currentPage <= 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"
                    }`}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 rounded-md ${
                      currentPage >= totalPages
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div>
               <table className="table-auto w-full text-sm text-center text-gray-500">
               <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-2 py-3">Transaction Ref</th>
                      <th className="px-2 py-3">Fee</th>
                      <th className="px-2 py-3">Period Covered</th>
                      <th className="px-2 py-3">Payee</th>
                      <th className="px-2 py-3">Block</th>
                      <th className="px-2 py-3">Lot</th>
                      <th className="px-2 py-3">Amount Due</th>
                      <th className="px-2 py-3">Amount Paid</th>
                      <th className="px-2 py-3">Mode of Payment</th>
                      <th className="px-2 py-3 text-center">Transaction Date</th>
                      <th className="px-2 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedPayments.length > 0 ? (
                      rejectedPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 border-b">
                          <td className="px-4 py-2">{payment.transaction_reference}</td>
                          <td className="px-4 py-2">{payment.fee_name}</td>
                          <td className="px-4 py-2">{payment.period_covered}</td>
                          <td className="px-4 py-2">
                            {payment.user?.firstName} {payment.user?.lastName}
                          </td>
                          <td className="px-2 py-2 text-left">{payment.user?.block}</td>
                          <td className="px-2 py-2 text-left">{payment.user?.lot}</td>
                          <td className="px-4 py-2 text-right">
                            PHP {parseFloat(payment.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {payment.fees
                              ? `PHP ${payment.fees
                                  .reduce((sum, fee) => sum + parseFloat(fee.amount_paid || 0), 0)
                                  .toFixed(2)}`
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2">{payment.mode_of_payment}</td>
                          <td className="px-2 py-2">{payment.transaction_date}</td>
                          <td className="px-4 py-2">{payment.reject_reason || "N/A"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          No rejected payments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className={`px-4 py-2 rounded-md ${
                      currentPage <= 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white"
                    }`}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className={`px-4 py-2 rounded-md ${
                      currentPage >= totalPages
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
              
            )}
          </div>
          
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryUser;
