import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updateUserInfo } from "../api/user";


const UserInformation = ({ user, onUpdate }) => {
  const [email, setEmail] = useState(user?.email || "");
  const [mobileNumber, setMobileNumber] = useState(user?.contact_number || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (number) => /^[0-9]{10,11}$/.test(number);

  const handleSave = async () => {
    if (!validateEmail(email)) {
      toast.error("Invalid email address.");
      return;
    }
    if (!validateMobile(mobileNumber)) {
      toast.error("Invalid mobile number. It should be 10-11 digits.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await updateUserInfo(user.id, email, mobileNumber);
      toast.success("User information updated successfully.");
      setIsEditing(false);

      setEmail(updatedUser.user.email);
      setMobileNumber(updatedUser.user.contact_number);

      onUpdate(updatedUser.user);
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const computeAge = (birthdate) => {
    if (!birthdate) return "N/A";
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white ">
      <ToastContainer />
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">User Information</h2>

      {/* Personal Information */}
      <div className="mb-8">
        <h3 className="text-xl font-medium text-gray-700 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "First Name", value: user?.firstName || "N/A" },
            { label: "Middle Name", value: user?.middleName || "N/A" },
            { label: "Last Name", value: user?.lastName || "N/A" },
            { label: "Gender", value: user?.gender || "N/A" },
            { label: "Birthdate", value: user?.birthdate || "N/A" },
            { label: "Age", value: computeAge(user.birthdate) },
           
          ].map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700">{field.label}</label>
              <input
                type="text"
                value={field.value}
                readOnly
                className="w-full border text-gray-500 bg-gray-100 border-gray-300 px-4 py-2 rounded-md cursor-not-allowed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Address Information */}
      <div className="mb-8">
        <h3 className="text-xl font-medium text-gray-700 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Block", value: user?.block || "N/A" },
            { label: "Lot", value: user?.lot || "N/A" },
          ].map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700">{field.label}</label>
              <input
                type="text"
                value={field.value}
                readOnly
                className="w-full border text-gray-500 bg-gray-100 border-gray-300 px-4 py-2 rounded-md cursor-not-allowed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8">
        <h3 className="text-xl font-medium text-gray-700 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!isEditing}
              className={`w-full border px-4 py-2 rounded-md ${
                isEditing ? "bg-white" : "bg-gray-100 text-gray-500 cursor-not-allowed"
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              readOnly={!isEditing}
              className={`w-full border px-4 py-2 rounded-md ${
                isEditing ? "bg-white" : "bg-gray-100 text-gray-500 cursor-not-allowed"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mt-6">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-3 hover:bg-gray-400"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default UserInformation;
