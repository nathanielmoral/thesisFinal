import React, { useState, useEffect } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import { getBreadcrumbs } from "../helpers/breadcrumbsHelper";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Feedback() {
  const location = useLocation();
  const crumbs = getBreadcrumbs(location);

  const [feedbackList, setFeedbackList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    axios
      .get("/api/feedbackIndex")
      .then((response) =>
        setFeedbackList(Array.isArray(response.data) ? response.data : [])
      )
      .catch((error) => toast.error("Error fetching feedback"));
  }, []);

  const truncateMessage = (message, maxLength) => {
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  // Handle search query input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when searching
  };


  const replyToFeedback = async (feedbackId, replyMessage) => {
    try {
      const response = await axios.post(`/api/feedback/${feedbackId}/reply`, {
        reply_message: replyMessage,
      });
      if (response.status === 200) {
        toast.success("Reply sent successfully!");
        setIsReplyModalOpen(false);
        setReplyMessage("");
      }
    } catch (error) {
      toast.error("Failed to send reply");
      console.error(error);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      const response = await axios.delete(`/api/feedback/${feedbackId}`);
      if (response.status === 200) {
        toast.success("Feedback deleted successfully!");
        setFeedbackList((prev) =>
          prev.filter((feedback) => feedback.id !== feedbackId)
        );
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to delete feedback");
      console.error(error);
    }
  };

  // Filter feedback based on email and message
  const filteredFeedbackList = feedbackList
    .filter((item) =>
      item.username_or_email
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen relative overflow-x-auto shadow-md sm:rounded-lg p-4 bg-[#FAFAFA]">
      {/* Toastify Container */}
      <ToastContainer />
      
      {/* Breadcrumbs Section */}
      <div className="bg-white rounded-md mb-4">
        <Breadcrumbs crumbs={crumbs} />
      </div>

      <h1 className="text-4xl font-bold text-left mb-6">Messages</h1>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by username or message"
          value={searchQuery}
          onChange={handleSearch}
          className="border p-2 rounded-md w-full md:w-1/3"
        />
      </div>

      {/* Feedback Table */}
      <table className="overflow-x-auto bg-white rounded-lg min-w-full divide-y divide-gray-200">
        <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-center">Username/Email</th>
            <th className="px-6 py-3 text-center">Message</th>
            <th className="px-6 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFeedbackList.map((item, index) => (
            <tr key={index} className="border-b border-gray-200 text-center">
              <td className="px-6 py-3">{item.username_or_email}</td>
              <td className="px-6 py-3">
                {truncateMessage(item.message, 50)}{" "}
                {item.message.length > 50 && (
                  <button
                    onClick={() => {
                      setSelectedFeedback(item);
                      setIsViewModalOpen(true);
                    }}
                    className="text-blue-500 underline text-sm"
                  >
                    View More
                  </button>
                )}
              </td>
              <td className="px-6 py-3 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setSelectedFeedback(item);
                    setIsReplyModalOpen(true);
                  }}
                  className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 text-xs sm:text-base flex items-center transition duration-150 ease-in-out"
                >
                  <FaEnvelope className="mr-1" />
                  Reply
                </button>
                <button
                  onClick={() => {
                    setSelectedFeedback(item);
                    setIsDeleteModalOpen(true);
                  }}
                  className="bg-[#C81E1E] text-white p-2 rounded hover:bg-red-800 text-xs sm:text-base flex items-center transition duration-150 ease-in-out"
                >
                  <FaTrash className="mr-1" />
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredFeedbackList.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center py-4 text-gray-500">
                No feedback available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={filteredFeedbackList.length < itemsPerPage}
          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Reply Modal */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Reply to Feedback</h3>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full h-32 border p-2 rounded-md"
            ></textarea>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => replyToFeedback(selectedFeedback.id, replyMessage)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Delete Feedback</h3>
            <p>Are you sure you want to delete this feedback?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFeedback(selectedFeedback.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

        {/* View Modal */}
        {isViewModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3 p-6 rounded-lg shadow-lg overflow-y-auto max-h-[90%]">
              <h3 className="text-lg font-medium mb-4 text-center">Feedback Message</h3>
              <p className="text-gray-700 whitespace-pre-wrap break-words mb-4">
                {selectedFeedback.message}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default Feedback;
