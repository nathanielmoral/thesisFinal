import React, { useState, useEffect } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import axios from "axios";
import Pagination from '../components/pagination';
import Breadcrumbs from '../components/Breadcrumbs';
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import {FaEye } from 'react-icons/fa';


const AdminCreateNotification = () => {
    const location = useLocation(); 
    const crumbs = getBreadcrumbs(location);  
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [totalNotifications, setTotalNotifications] = useState(0);

    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/notifications", {
                params: {
                    search: searchTerm,
                    page: currentPage,
                    per_page: entriesPerPage,
                },
            });

            // Group notifications by user and only keep the latest notification
            const groupedNotifications = response.data.data.reduce((acc, curr) => {
                const userId = curr.user.id;
                // Only keep the latest notification per user
                acc[userId] = acc[userId] && new Date(acc[userId].created_at) > new Date(curr.created_at) ? acc[userId] : curr;
                return acc;
            }, {});

            setNotifications(Object.values(groupedNotifications));
            setTotalNotifications(Object.keys(groupedNotifications).length);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalNotifications / entriesPerPage);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleEntriesChange = (e) => {
        setEntriesPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchNotifications();
    }, [currentPage, entriesPerPage, searchTerm]);

    return (
        <div className="min-h-screen relative overflow-x-auto bg-[#FAFAFA] p-4">
        
        {/* BreadCrumbs Section */}
          <div className="bg-white rounded-md mb-6">
            <Breadcrumbs crumbs={crumbs} />
          </div>

            <h1 className="text-4xl font-bold mb-6">Notifications</h1>

            <div className="mb-4 px-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        <div className="relative flex-grow">
                        <svg
                            className="absolute left-3 top-2.5 w-5 h-5 text-gray-800"
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
                            <input
                                type="text"
                                placeholder="Search Message"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="form-input w-full pl-10 py-2 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="entries" className="mr-2">Show</label>
                            <select
                                id="entries"
                                value={entriesPerPage}
                                onChange={handleEntriesChange}
                                className="form-select border border-gray-300 rounded"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                            <span>entries</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/create-notification")}
                        className="bg-green-800 text-white p-2 rounded hover:bg-green-900 flex items-center text-m mt-2"
                    >
                        Add Notification
                    </button>
                </div>
            </div>

            <div className="relative overflow-x-auto border-y border-gray-300 shadow-sm">
                <table className="table-auto min-w-full bg-white">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                            <th className="px-6 py-3 text-left">User</th>
                            <th className="px-6 py-3 text-left">Message</th>
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <tr key={index} className="border-b border-gray-200 text-left">
                                    <td className="px-6 py-4 capitalize">
                                        {notification.user.firstName} {notification.user.lastName}
                                    </td>
                                    <td className="px-6 py-4">{notification.message}</td>
                                    <td className="px-6 py-4">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            className="bg-green-700 text-white px-2 py-1 rounded hover:bg-green-800 text-xs sm:text-base flex items-center"
                                            onClick={() => {
                                                console.log("Navigating to user ID:", notification.user.id);
                                                navigate(`/notification/${notification.user.id}`, {
                                                    state: { userName: `${notification.user.firstName} ${notification.user.lastName}` },
                                                });
                                            }}
                                        >
                                            <FaEye className="mr-1" /> 
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No notifications found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                handlePageChange={handlePageChange}
            />
        </div>
    );
};

export default AdminCreateNotification;
