import React, { useEffect, useState } from 'react';
import { fetchApprovedUsers } from '../api/user';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import {FaEye } from 'react-icons/fa';
import BeatLoader from 'react-spinners/BeatLoader';
import axios from "axios";


const HouseList = () => {
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterLot, setFilterLot] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [lots, setLots] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const crumbs = getBreadcrumbs(location);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await fetchApprovedUsers(); // Fetch data
        const groupedUsers = groupByBlockAndLot(users); // Process data
        setApprovedUsers(groupedUsers);
        setFilteredFamilies(groupedUsers);

        // Extract unique blocks and lots for filters
        const uniqueBlocks = [...new Set(groupedUsers.map((family) => family.block))];
        const uniqueLots = [...new Set(groupedUsers.map((family) => family.lot))];
        setBlocks(uniqueBlocks);
        setLots(uniqueLots);
      } catch (error) {
        console.error('Error fetching approved users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);


  const groupByBlockAndLot = (users) => {
    const grouped = users.flatMap((user) => {
      // Split blocks and lots into arrays (assuming they are comma-separated strings)
      const blocks = user.block.split(',').map((b) => b.trim());
      const lots = user.lot.split(',').map((l) => l.trim());
  
      // Map each block-lot pair into its own entry
      return blocks.map((block, index) => ({
        block: block,
        lot: lots[index] || 'N/A', // If no matching lot exists, use 'N/A'
        accountHolder: user.is_account_holder ? user : null,
        members: [user], // Start with the user as the first member
      }));
    });
  
    // Reduce to group by block-lot pair
    const groupedByKey = grouped.reduce((acc, entry) => {
      const key = `${entry.block}-${entry.lot}`;
      if (!acc[key]) {
        acc[key] = {
          block: entry.block,
          lot: entry.lot,
          accountHolder: entry.accountHolder,
          members: [],
        };
      }
      acc[key].members.push(...entry.members);
      if (entry.accountHolder) {
        acc[key].accountHolder = entry.accountHolder;
      }
      return acc;
    }, {});
  
    // Ensure each group has an account holder
    Object.values(groupedByKey).forEach((family) => {
      if (!family.accountHolder) {
        family.accountHolder = family.members[0];
      }
    });
  
    // Convert to array and sort by block and lot
    return Object.values(groupedByKey).sort((a, b) => {
      const blockA = parseInt(a.block, 10);
      const blockB = parseInt(b.block, 10);
      const lotA = parseInt(a.lot, 10);
      const lotB = parseInt(b.lot, 10);
  
      return blockA !== blockB ? blockA - blockB : lotA - lotB;
    });
  };
  
  const mapFamilies = (families) => {
    return families.map((family) => ({
      ...family,
      accountHolder: family.accountHolder || family.members[0],
    }));
  };

  const handleViewFamily = (family) => {
    if (family.block && family.lot) {
      navigate(`/family-details/${family.block}-${family.lot}`, { state: { family } });
    } else {
      console.error('Block and/or Lot are undefined. Navigation aborted.');
    }
  };

  useEffect(() => {
    const filtered = approvedUsers.filter((family) => {
      const matchesSearch = `${family.accountHolder ? family.accountHolder.firstName : ''} ${family.accountHolder ? family.accountHolder.lastName : ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesBlock = !filterBlock || family.block === filterBlock;
      const matchesLot = !filterLot || family.lot === filterLot;

      return matchesSearch && matchesBlock && matchesLot;
    });
    setFilteredFamilies(filtered);
  }, [searchQuery, filterBlock, filterLot, approvedUsers]);

  const handleEntriesPerPageChange = (event) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastFamily = currentPage * entriesPerPage;
  const indexOfFirstFamily = indexOfLastFamily - entriesPerPage;
  const currentFamilies = filteredFamilies.slice(indexOfFirstFamily, indexOfLastFamily);
  const totalPages = Math.ceil(filteredFamilies.length / entriesPerPage);
  const capitalizeFirstLetter = (string) => {
    return string.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <BeatLoader color="#1D4ED8" size={15} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-auto shadow-md sm:rounded-md p-4 bg-[#FAFAFA]">
      <div className="bg-white rounded-md mb-4">
        <Breadcrumbs crumbs={crumbs} />
      </div>
      <h1 className="text-4xl font-bold mb-6">House List</h1>

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
                placeholder="Search Account Holder"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input w-full pl-10 py-2 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <label htmlFor="entries" className="mr-2">Show</label>
              <select
                id="entries"
                value={entriesPerPage}
                onChange={handleEntriesPerPageChange}
                className="form-select border border-gray-300 rounded"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="ml-2">entries</span>
            </div>
            <div>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="form-select border border-gray-300 rounded mr-2"
            >
              <option value="">All Blocks</option>
              {blocks.map((block) => (
                <option key={block} value={block}>
                  Block {block}
                </option>
              ))}
            </select>
            <select
              value={filterLot}
              onChange={(e) => setFilterLot(e.target.value)}
              className="form-select border border-gray-300 rounded"
            >
              <option value="">All Lots</option>
              {lots.map((lot) => (
                <option key={lot} value={lot}>
                  Lot {lot}
                </option>
              ))}
            </select>
          </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Account Holder</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lot</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Members</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentFamilies.map((families, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                {families.accountHolder ? capitalizeFirstLetter(`${families.accountHolder.firstName} ${families.accountHolder.lastName}`) : 'No Account Holder'}

                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">{families.block}</td>
                <td className="px-6 py-4 text-center whitespace-nowrap">{families.lot}</td>
                <td className="px-6 py-4 text-center whitespace-nowrap">{families.members.length}</td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <button
                    className="bg-green-700 text-white px-2 py-1 rounded hover:bg-green-800 text-xs sm:text-base flex items-center"
                    onClick={() => handleViewFamily(families)}
                  >
                    <FaEye className="mr-1" /> 
                    View
                  </button>
                </td>
              </tr>
            ))}
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

const Pagination = ({ totalPages, currentPage, handlePageChange }) => (
  <div className="flex justify-center mt-4 mb-2">
    {Array.from({ length: totalPages }, (_, index) => (
      <button
        key={index}
        onClick={() => handlePageChange(index + 1)}
        className={`mx-1 px-3 py-1 border rounded-lg ${
          currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
        }`}
      >
        {index + 1}
      </button>
    ))}
  </div>
);

export default HouseList;
