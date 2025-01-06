import React, { useState, useEffect } from "react";
import { fetchUserDetails } from "../api/user";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaMoneyCheckAlt, FaCalendarAlt, FaFileInvoiceDollar } from "react-icons/fa";
import PaymentModal from "../components/PaymentModal";
import ViewProofModal from "../components/ViewProofModal";

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ is_account_holder: 0 });
    const [userId, setUserId] = useState(null);
    const [payments, setPayments] = useState([]);
    const [fees, setFees] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [activatedYears, setActivatedYears] = useState([new Date().getFullYear()]);
    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [accountNumber, setAccountNumber] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMonth, setModalMonth] = useState(null);
    const [modalTotalAmount, setModalTotalAmount] = useState(0);
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofUrl, setProofUrl] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        perPage: 12,
        currentPage: 1,
        lastPage: 1,
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userData = await fetchUserDetails();
                if (userData) {
                    setUser(userData);
                    setUserId(userData.id || null);
                    fetchMonthlyPaymentAmount()
                }
            } catch (error) {
                toast.error("Error fetching user details.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
        setActivatedYears(years);
    }, []);


    useEffect(() => {
        if (userId) {
            fetchFees();
        }
    }, [userId, year, pagination.currentPage]);
    
    const fetchFees = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/users/${userId}/fees`, {
                params: { year, page: pagination.currentPage, per_page: pagination.perPage },
            });
    
            if (response.status === 200) {
                console.log("Fetched Fees:", response.data); // Debugging
                setFees(response.data.data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.total || 0,
                    perPage: response.data.per_page || 12,
                    lastPage: response.data.last_page || 1,
                }));
            } else {
                setFees([]);
                toast.error(response.data.message || "No fees found.");
            }
        } catch (error) {
            toast.error("Failed to fetch fees. Please try again.");
            console.error("Error fetching fees:", error);
        } finally {
            setLoading(false);
        }
    };
    const handleConfirmPayment = async ({ file, month, year }) => {
        try {
            // Find the fee record for the given month
            const feeToUpdate = fees.find((fee) => fee.month === month);
    
            if (!feeToUpdate) {
                toast.error("Fee record not found for the selected month.");
                return;
            }
    
            // Debugging: Log the feeToUpdate and userId
            console.log("Fee to Update:", feeToUpdate);
            console.log("User ID:", userId);
    
            // Prepare FormData
            const formData = new FormData();
            formData.append("user_id", userId);
            formData.append("proof_of_payment", file);
            formData.append("year", year);
            formData.append("month", month);
            formData.append("mode_of_payment", "Gcash Payment");
            formData.append("transaction_date", new Date().toISOString());
    
            // Send request to backend
            const response = await axios.post(
                `/api/block-lot-fees/${feeToUpdate.id}/updatePayment`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
    
            // Handle success response
            if (response.status === 200) {
                toast.success(`Payment successful! TRN: ${response.data.transaction_reference}`);
                fetchFees(); // Refresh fee records
                setShowModal(false); // Close modal
            } else {
                // Handle unexpected success responses
                toast.error(response.data.message || "Failed to process payment. Please try again.");
            }
        } catch (error) {
            console.error("Error updating payment:", error);
    
            // Handle error response
            const errorMessage =
                error.response?.data?.message || "Failed to process payment. Please try again.";
            toast.error(errorMessage);
        }
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

    const openModal = (month) => {
        const totalAmount = calculateTotalAmount(month);
        setModalMonth(month);
        setModalTotalAmount(totalAmount);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalMonth(null);
        setModalTotalAmount(0);
    };

    const calculateTotalAmount = (month) => {
        const unpaidMonths = fees.filter(
            (fee) => fee.payment_status !== "Paid" && fee.month <= month
        );

        // Ensure fee.fee?.amount is treated as a number
        const totalAmount = unpaidMonths.reduce((total, fee) => {
            return total + Number(fee.fee?.amount || 0);
        }, 0);

        console.log("Unpaid Months:", unpaidMonths);
        console.log("Total Amount:", totalAmount);

        return totalAmount;
    };

    const fetchMonthlyPaymentAmount = async () => {
        try {
            const response = await axios.get(`/api/settings/monthly-payment`);
            setAccountNumber(response.data.account_number);
        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="text-xl font-bold text-gray-800">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ToastContainer />
            <PaymentModal
                isOpen={showModal}
                onClose={closeModal}
                onConfirm={(file) => {
                    handleConfirmPayment(file, modalMonth);
                    closeModal();
                }}
                month={modalMonth}
                year={year}
                totalAmount={modalTotalAmount}
            />

            <ViewProofModal isOpen={showProofModal} onClose={closeProofModal} proofUrl={proofUrl} />

            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 overflow-y-auto h-screen">
                <h1 className="text-4xl font-bold mb-4 text-gray-800">Payments for {year}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      <div className="flex items-center bg-blue-100 p-4 rounded-lg shadow">
                        <FaMoneyCheckAlt className="text-blue-500 text-3xl mr-4" />
                        <div>
                            <p className="text-gray-700 text-sm">Monthly Payment</p>
                            <p className="text-2xl font-bold text-gray-900">
                                PHP {fees.length > 0 
                                    ? fees[0]?.fee?.amount || 0 
                                    : "0"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center bg-green-100 p-4 rounded-lg shadow">
                        <FaFileInvoiceDollar className="text-green-500 text-3xl mr-4" />
                        <div>
                            <p className="text-gray-700 text-sm">Gcash Number</p>
                            <p className="text-2xl font-bold text-gray-900">{accountNumber}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    <label htmlFor="year" className="text-gray-700 font-bold">
                        Select Year:
                    </label>
                    <select
                        id="year"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="border border-gray-300 p-2 rounded-md"
                    >
                        {[...activatedYears].reverse().map((activatedYear) => (
                            <option key={activatedYear} value={activatedYear}>
                                {activatedYear}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="overflow-x-auto mb-8">
                      <table className="table-auto w-full text-sm text-center text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-2 py-3 border-b text-center">Fee</th>
                                    <th className="px-2 py-3 border-b text-center">Description</th>
                                    <th className="px-2 py-3 border-b text-center">Month</th>
                                    <th className="px-2 py-3 border-b text-center">Amount</th>
                                    <th className="px-2 py-3 border-b text-center">Status</th>
                                    <th className="px-2 py-3 border-b text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.length > 0 ? (
                                    (() => {
                                        const filteredFees = fees
                                        .filter((fee) => fee.payment_status !== "Paid") 
                                            .sort((a, b) => b.month - a.month); // Sort descending

                                        if (filteredFees.length === 0) {
                                            // Display message when no unpaid fees exist
                                            return (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                        No fees found for this year.
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return filteredFees.map((fee) => {
                                            const monthName = new Date(0, fee.month - 1).toLocaleString("default", {
                                                month: "long",
                                            });
                                            const currentMonth = new Date().getMonth() + 1;

                                            const status =
                                                fee.payment_status === "Paid"
                                                    ? "Paid"
                                                    : fee.payment_status === "Processing"
                                                    ? "Processing"
                                                    : fee.month === currentMonth
                                                    ? "Pending"
                                                    : "Unpaid";

                                            return (
                                                <tr key={fee.id} className="hover:bg-gray-50 border-b">
                                                    <td className="px-2 py-3">{fee.fee?.name || "N/A"}</td>
                                                    <td className="px-2 py-3">{fee.fee?.description || "N/A"}</td>
                                                    <td className="px-2 py-3">{monthName}</td>
                                                    <td className="px-2 py-3">PHP {fee.fee?.amount || 0}</td>
                                                    <td
                                                        className={`px-2 py-3 font-bold ${
                                                            status === "Paid"
                                                                ? "text-green-500"
                                                                : status === "Processing"
                                                                ? "text-blue-500"
                                                                : status === "Pending"
                                                                ? "text-yellow-500"
                                                                : "text-red-500"
                                                        }`}
                                                    >
                                                        {status}
                                                    </td>
                                                    <td className="px-2 py-3 text-center">
                                                    {/* Show 'View Receipt' if Paid */}
                                                    {fee.payment_status === "Paid" && fee.proof_of_payment && (
                                                        <button
                                                            onClick={() => openProofModal(fee.proof_of_payment)}
                                                            className="px-2 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                        >
                                                            View Receipt
                                                        </button>
                                                    )}

                                                    {/* Disable payment if 'Processing' */}
                                                        {fee.payment_status === "Processing" ? (
                                                            <span className="text-blue-500 font-bold">Processing</span>
                                                        ) :(user.is_account_holder === 1 &&
                                                        (fee.payment_status === "Unpaid" || fee.payment_status === "Rejected") 
                                                        ) && (
                                                        <button
                                                            onClick={() => openModal(fee.month)}
                                                            disabled={fees.some((f) => f.payment_status === "Processing")}
                                                            className={`px-2 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed ${
                                                                fees.some((f) => f.payment_status === "Processing")
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                            }`}
                                                        >
                                                            Pay Now
                                                        </button>
                                                    )}
                                                </td>
                                                </tr>
                                            );
                                        });
                                    })()
                                ) : (
                                    // Display message when the entire fees array is empty
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            No fees found for this year.
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                </div>

                     {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <button
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700">
                        Page {pagination.currentPage} of {pagination.lastPage}
                    </span>
                    <button
                        disabled={pagination.currentPage === pagination.lastPage}
                        onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
