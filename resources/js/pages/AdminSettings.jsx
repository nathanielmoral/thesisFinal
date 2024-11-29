import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Breadcrumbs from '../components/Breadcrumbs';
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import { useLocation } from "react-router-dom";



const AdminSettings = () => {
    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [accountNumber, setAccountNumber] = useState("");
    const location = useLocation(); 
    const crumbs = getBreadcrumbs(location); 

    const fetchMonthlyPaymentAmount = async () => {
        try {
            const response = await axios.get(`/api/settings/monthly-payment`);
            setMonthlyPayment(response.data.monthly_payment);
            setAccountNumber(response.data.account_number);
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("Failed to fetch settings.");
        }
    };

    const updateSettings = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/settings/update`, {
                account_number: accountNumber,
                monthly_payment: monthlyPayment,
            });
            toast.success("Settings have been updated successfully.");
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Failed to update settings.");
        }
    };

    useEffect(() => {
        fetchMonthlyPaymentAmount();
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFA] p-4">
            <ToastContainer />

                   {/* BreadCrumbs Section */}
          <div className="bg-white rounded-md mb-2">
            <Breadcrumbs crumbs={crumbs} />
          </div>
          <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Payment Settings</h1>
                </div>

            <div className="max-w-3xl mx-auto bg-[#FAFAFA]">
               
                <form onSubmit={updateSettings} className="space-y-6 ">
                    {/* Monthly Payment Input */}
                    <div>
                        <label htmlFor="monthlyPayment" className="block text-gray-700 text-sm font-bold mb-2">
                            Monthly Payment (PHP)
                        </label>
                        <input
                            type="number"
                            id="monthlyPayment"
                            value={monthlyPayment}
                            onInput={(e) => setMonthlyPayment(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500"
                        />
                    </div>

                    {/* Account Number Input */}
                    <div>
                        <label htmlFor="accountNumber" className="block text-gray-700 text-sm font-bold mb-2">
                            Gcash Account Number
                        </label>
                        <input
                            type="text"
                            id="accountNumber"
                            value={accountNumber}
                            onInput={(e) => setAccountNumber(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="text-right">
                        <button
                            type="submit"
                            className=" w-full px-6 py-3 bg-[#1D4ED8] text-white font-bold rounded-md hover:bg-blue-800 active:scale-95 transition-all"
                        >
                            Update Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSettings;
