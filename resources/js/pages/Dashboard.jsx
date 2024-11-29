import React, { useState, useEffect } from "react";
import { fetchUserDetails } from "../api/user";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaMoneyCheckAlt, FaCalendarAlt, FaFileInvoiceDollar } from "react-icons/fa";
import PaymentModal from "../components/PaymentModal";
import ViewProofModal from "../components/ViewProofModal";


const Dashboard = () => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState({ is_account_holder: 0 });
    const [userId, setUserId] = useState(null);
    const [payments, setPayments] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [activatedYears, setActivatedYears] = useState([new Date().getFullYear()]);
    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [accountNumber, setAccountNumber] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMonth, setModalMonth] = useState(null);
    const [modalTotalAmount, setModalTotalAmount] = useState(0);
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofUrl, setProofUrl] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await fetchUserDetails();
                if (data) {
                    setUser(data);
                    setUserId(data.id || null);
                }
                fetchPayments(year, data?.id);
                fetchActivatedYears();
                fetchMonthlyPaymentDetails()
                fetchMonthlyPaymentAmount()
            } catch (error) {
                toast.error("Error fetching user details.");
            }
        };
        fetchUserData();
    }, [year]);

    const fetchPayments = async (selectedYear, userID) => {
        try {
            const response = await axios.get(`/api/user/${userID || "guest"}/payments/${selectedYear}`);
            setPayments(response.data);
        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    };

    const fetchActivatedYears = async () => {
        try {
            const response = await axios.get(`/api/user/active-years`);
            setActivatedYears([...new Set(response.data)]);
        } catch (error) {
            console.error("Error fetching activated years:", error);
        }
    };

    const fetchMonthlyPaymentDetails = async () => {
        try {
            const response = await axios.get(`/api/settings/monthly-payment`);
            setMonthlyPayment(response.data.monthly_payment);
            setAccountNumber(response.data.account_number);
        } catch (error) {
            console.error("Error fetching monthly payment details:", error);
        }
    };

    
    const calculateTotalAmount = (month) => {
        const unpaidMonths = payments.filter(
            (payment) =>
                payment.payment_status !== "Paid" &&
                payment.month <= month
        );

        const totalAmount = unpaidMonths.length * monthlyPayment; // Assuming the monthly payment is $250
        return totalAmount;
    };

    const fetchMonthlyPaymentAmount = async () => {
        try {
            const response = await axios.get(`/api/settings/monthly-payment`);
            setMonthlyPayment(response.data.monthly_payment);
            setAccountNumber(response.data.account_number);
        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    };

    
    const addPayment = async (file, month) => {
        const formData = new FormData();
        formData.append("year", year);
        formData.append("month", month);
        formData.append("proof_of_payment", file);

        try {
            setLoading(true);
            const response = await axios.post(`/api/user/${userId}/payments`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            toast.success(response.data.message);
            setLoading(false);
            fetchPayments(year, userId);
        } catch (error) {
            setLoading(false);
            toast.error("Failed to submit payment.");
        }
    };


    const openModal = (month) => {
        setModalMonth(month);
        setModalTotalAmount(calculateTotalAmount(month)); // Set the total amount
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalMonth(null);
        setModalTotalAmount(0);
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
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <ToastContainer />
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-4xl font-bold mb-4 text-gray-800">Payments for {year}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-center bg-blue-100 p-4 rounded-lg shadow">
                        <FaMoneyCheckAlt className="text-blue-500 text-3xl mr-4" />
                        <div>
                            <p className="text-gray-700 text-sm">Monthly Payment</p>
                            <p className="text-2xl font-bold text-gray-900">PHP {monthlyPayment}</p>
                        </div>
                    </div>
                    <div className="flex items-center bg-green-100 p-4 rounded-lg shadow">
                        <FaFileInvoiceDollar className="text-green-500 text-3xl mr-4" />
                        <div>
                            <p className="text-gray-700 text-sm">Gcash Number</p>
                            <p className="text-2xl font-bold text-gray-900">{accountNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center bg-yellow-100 p-4 rounded-lg shadow">
                        <FaCalendarAlt className="text-yellow-500 text-3xl mr-4" />
                        <div>
                            <p className="text-gray-700 text-sm">Selected Year</p>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {activatedYears.map((yr) => (
                                    <option key={yr} value={yr}>
                                        {yr}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                            <tr>
                                <th className="px-6 py-3 border-b text-left">Month</th>
                                <th className="px-6 py-3 border-b text-left">Status</th>
                                <th className="px-6 py-3 border-b text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.month} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 border-b text-gray-700">
                                        {new Date(0, payment.month - 1).toLocaleString("default", { month: "long" })}
                                    </td>
                                    <td className="px-6 py-4 border-b text-gray-700">
                                        {payment.payment_status}
                                    </td>
                                    <td className="px-6 py-4 border-b text-center">
                                        {payment.payment_status === "Paid" && payment.proof_of_payment && (
                                            <button
                                                onClick={() => openProofModal(payment.proof_of_payment)}
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                            >
                                                View Receipt
                                            </button>
                                        )}
                                        {(user.is_account_holder === 1 &&
                                            (payment.payment_status === "Unpaid" || payment.payment_status === "Rejected")) && (
                                            <button
                                                onClick={() => openModal(payment.month)}
                                                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                                            >
                                                Add Payment
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaymentModal
                isOpen={showModal}
                onClose={closeModal}
                onConfirm={(file) => {
                    addPayment(file, modalMonth);
                    closeModal();
                }}
                month={modalMonth}
                year={year}
                totalAmount={modalTotalAmount}
            />

            <ViewProofModal isOpen={showProofModal} onClose={closeProofModal} proofUrl={proofUrl} />
        </div>
    );
};

export default Dashboard;
