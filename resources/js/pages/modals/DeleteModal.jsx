import React from 'react';
import { BeatLoader } from 'react-spinners';

const DeleteModal = ({ show, onClose, onConfirm, title, content, loading }) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose(); // Close the modal on successful delete
    };

    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[999]">
            <div className="relative p-5 border w-full max-w-md mx-auto shadow-lg rounded-md bg-white">
                {/* Modal Title */}
                <div className="text-center">
                    <h3 className="text-xl leading-6 font-semibold text-gray-900">{title}</h3>
                </div>

                {/* Centered SVG Icon */}
                <div className="flex justify-center mt-4">
                    <svg
                        className="w-16 h-16 text-gray-800 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke="red"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                        />
                    </svg>
                </div>

                {/* Modal Content */}
                <div className="mt-2 px-6 py-3 flex justify-center">
                    <p className="text-gray-600">{content}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between px-4 py-3 space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
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
                                Confirming...
                            </span>
                        ) : (
                            "Confirm"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
