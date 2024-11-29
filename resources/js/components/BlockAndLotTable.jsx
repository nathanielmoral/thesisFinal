import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BlockAndLotTable = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // For delete confirmation
  const [blockToDelete, setBlockToDelete] = useState(null); // Block being deleted
  const [currentBlock, setCurrentBlock] = useState(null); // For storing current block data for editing // For storing current block data for editing
  const [formData, setFormData] = useState({
    block: '',
    lot: '',
    status: ''
  });

  // Fetch blocks with pagination, search, and filter
  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/blocks-lots', {
          params: { search, status, page },
        });
        setBlocks(response.data.data);
        setTotalPages(response.data.last_page);
      } catch (error) {
        console.error('Error fetching blocks:', error);
        toast.error('Failed to fetch blocks');
      }
      setLoading(false);
    };

    fetchBlocks();
  }, [search, status, page]);
  
  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/blocks-lots', {
        params: { search, status, page },
      });
      setBlocks(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Failed to fetch blocks');
    }
    setLoading(false);
  };
  
  const handleDeleteConfirmation = (block) => {
    setBlockToDelete(block);
    setShowDeleteModal(true);
  };


  const handleDelete = async () => {
    if (!blockToDelete) return;
    try {
      await axios.delete(`/api/blocks-lots/${blockToDelete.id}`);
      setBlocks(blocks.filter((block) => block.id !== blockToDelete.id));
      toast.success('Block and Lot deleted successfully');
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete block');
    } finally {
      setShowDeleteModal(false);
      setBlockToDelete(null);
    }
  };
  // Handle opening the modal for creating a new block
  const openCreateModal = () => {
    setCurrentBlock(null);
    setFormData({ block: '', lot: '', status: '' });
    setShowModal(true);
  };

  // Handle opening the modal for updating an existing block
  const openUpdateModal = (block) => {
    setCurrentBlock(block);
    setFormData({ block: block.block, lot: block.lot, status: block.status });
    setShowModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form submission for both create and update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { block, lot, status } = formData;

    try {
      if (currentBlock) {
        // Update existing block
        await axios.put(`/api/blocks-lots/${currentBlock.id}`, { status });
        toast.success('Block and Lot updated successfully');
      } else {
        // Create new block
        await axios.post('/api/blocks-lots', { block, status });
        toast.success('Block and Lot created successfully');
      }
      setShowModal(false);
      setPage(1); // Reset to first page after create/update
      fetchBlocks()
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Failed to save block');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mb-4">
        {/* Search Input */}
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
            placeholder="Search by block or lot"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-full pl-10 py-2 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border rounded-md shadow-sm"
        >
          <option value="">Select Status</option>
          <option value="Unoccupied">Unoccupied</option>
          <option value="Occupied">Occupied</option>
        </select>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto px-4 py-2 bg-green-700 text-white hover:bg-green-800 flex items-center  rounded-md"
        >   
          New Block and Lot
        </button>
      </div>

      <div className="relative overflow-x-auto sm:rounded-lg border-gray-300 shadow-sm">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Block
                </th>
                <th scope="col" className="px-6 py-3">
                  Lot
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : blocks.length > 0 ? (
                blocks.map((block) => (
                  <tr
                    key={block.id}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {block.block}
                    </td>
                    <td className="px-6 py-4">{block.lot}</td>
                    <td
                      className={`px-6 py-4 font-bold ${
                         block.status === "Occupied"
                          ? "text-green-700"
                          : "text-red-500"
                      }`}
                    >
                      {block.status}
                    </td>
                    <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteConfirmation(block)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="text-sm">Page {page} of {totalPages}</span>
        <button
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      {/* Modal for Create / Update */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h2 className="text-xl mb-4">{currentBlock ? 'Update Block and Lot' : 'Create Block and Lot'}</h2>
            <form onSubmit={handleSubmit}>
              {!currentBlock &&
                <div className="mb-4">
                  <label className="block text-sm font-medium">Block</label>
                  <input
                    type="text"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>
              }
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  {currentBlock ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* Delete Confirmation Modal */}
{showDeleteModal && blockToDelete && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
      <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
      <p className="mb-6">
        {blockToDelete.status === 'Occupied' ? (
          <span className="text-red-500 font-medium">
            This block is occupied and cannot be deleted.
          </span>
        ) : (
          'Are you sure you want to delete this unoccupied block?'
        )}
      </p>
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={blockToDelete.status === 'Unoccupied' ? handleDelete : null}
          className={`px-4 py-2 rounded-md ${
            blockToDelete.status === 'Unoccupied'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={blockToDelete.status !== 'Unoccupied'}
        >
          {blockToDelete.status === 'Unoccupied' ? 'Delete' : 'Cannot Delete'}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default BlockAndLotTable;
