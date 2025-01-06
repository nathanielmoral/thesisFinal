import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify"; // Import toastify
import FileUpload from "./FileUpload";

const PaymentModal = ({ isOpen, onClose, onConfirm, month, year, totalAmount }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (selectedFile) => {
        setFile(selectedFile);
    };

    const handleConfirm = () => {
        if (!file) {
            toast.error("Please upload a proof of payment."); // Show error toast if file is not uploaded
            return;
        }

        // Send relevant data to the parent
        onConfirm({ file, month, year });

        // Show success toast after confirmation
        toast.success(`Payment for ${month} ${year} confirmed successfully!`);

        onClose(); // Close the modal
    };

    if (!isOpen) return null;

    const monthName = new Date(0, month - 1).toLocaleString("default", {
        month: "long",
    });

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Payment</h2>
                <p className="text-gray-700 mb-6">
                    Are you sure you want to add a payment for{" "}
                    <span className="font-bold">{monthName} {year}</span>?
                </p>
                <p className="text-gray-700 mb-6">
                Total Amount to Pay: <span className="font-bold">PHP {totalAmount}</span>
                </p>

                {/* File upload */}
                <FileUpload onFileChange={handleFileChange} />

                <div className="flex justify-end gap-4 mt-5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                    >
                        Confirm
                    </button>
                </div>
            </div>

            <ToastContainer /> {/* Render ToastContainer to display toasts */}
        </div>
    );
};

export default PaymentModal;
