import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const UserNotificationDetails = () => {
    const { userId } = useParams();
    const { state } = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllNotifications = async () => {
            try {
                const response = await axios.get(`/api/notifications/${userId}`);
                setNotifications(response.data);
            } catch (error) {
                setError("Failed to fetch notifications. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllNotifications();
    }, [userId]);

    const totalPages = Math.ceil(notifications.length / itemsPerPage);
    const displayedNotifications = notifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (direction) => {
        if (direction === "prev" && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
        if (direction === "next" && currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="text-blue-500 font-semibold text-lg">
                        Loading notifications...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-red-500 font-semibold text-lg">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="container  max-w-full">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Notifications for {state?.userName || "User"}
                    </h1>
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm">
                        <label htmlFor="itemsPerPage" className="mr-2">
                            Items per page:
                        </label>
                        <select
                            id="itemsPerPage"
                            className="border rounded px-2 py-1"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value, 10));
                                setCurrentPage(1); // Reset to first page
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Page {currentPage} of {totalPages}
                    </p>
                </div>

                {displayedNotifications.length > 0 ? (
                    <ul className="space-y-4">
                        {displayedNotifications.map((notification) => (
                            <li key={notification.id} className="bg-white shadow-md rounded-md p-4">
                                <p className="text-lg font-medium text-gray-800">
                                    {notification.message}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(notification.created_at).toLocaleString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-lg text-gray-500">
                        No notifications found for this user.
                    </p>
                )}

                <div className="flex items-center justify-between mt-6">
                    <button
                        className={`py-2 px-4 rounded ${
                            currentPage === 1
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange("prev")}
                    >
                        Previous
                    </button>
                    <button
                        className={`py-2 px-4 rounded ${
                            currentPage === totalPages
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange("next")}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserNotificationDetails;
