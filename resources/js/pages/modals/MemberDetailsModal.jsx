import React from 'react';
import { Dialog } from '@headlessui/react';
import { HiX } from 'react-icons/hi';

const MemberDetailsModal = ({ isOpen, onClose, member }) => {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
        >
          <HiX className="w-6 h-6" />
        </button>

        {/* Profile Section */}
        <div className="flex flex-col items-center">
          <img
            src={`/storage/${member.image || 'board_members/default-avatar.png'}`}
            alt={`${member.user.firstName} ${member.user.lastName}'s photo`}
            className="w-28 h-28 rounded-full object-cover border-4 border-gray-200 shadow-md mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-900">{`${member.user.firstName} ${member.user.lastName}`}</h2>
          <p className="text-sm text-gray-600">{member.position}</p>
        </div>

        {/* Divider */}
        <hr className="my-6 border-gray-200" />

        {/* Details Section */}
        <div className="grid grid-cols-1 gap-4 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="font-medium">Username:</span>
            <span>{member.user.username || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Email:</span>
            <span>{member.user.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Block:</span>
            <span>{member.user.block || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Lot:</span>
            <span>{member.user.lot || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Start of Term:</span>
            <span>{member.start_of_term || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">End of Term:</span>
            <span>{member.end_of_term || 'N/A'}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default MemberDetailsModal;
