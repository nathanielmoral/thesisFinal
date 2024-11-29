import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SpamNotificationToggle from './SpamNotificationToggle';
import { Spinner, Pagination, Table } from 'flowbite-react';
import axios from 'axios';

const DelayedPaymentTable = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/delayed-payments?search=${search}&page=${page}`);
      const data = response.data;
      setPayments(data.data);
      setTotalPages(data.last_page);
    } catch (error) {
      console.error('Error fetching delayed payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, page]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to the first page when search changes
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
       <div className="flex flex-wrap gap-4 items-center">
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
              placeholder="Search by Account Holder"
              value={search}
              onChange={handleSearchChange}
              className="form-input w-full pl-10 py-2 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Spam Notification Toggle */}
          <div className="flex-shrink-0 bg-gray-400 p-2 rounded-md">
            <SpamNotificationToggle />
          </div>
        </div>   
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spinner size="xl" />
        </div>
      ) : payments.length > 0 ? (
        <>
          <Table className="min-w-full bg-white shadow rounded-md border border-gray-300">
            <Table.Head>
              <Table.HeadCell>Year</Table.HeadCell>
              <Table.HeadCell>Month</Table.HeadCell>
              <Table.HeadCell>Account Holder</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {payments.map((payment) => (
                <Table.Row key={payment.id} className="bg-white hover:bg-gray-50">
                  <Table.Cell>{payment.year}</Table.Cell>
                  <Table.Cell>{payment.month}</Table.Cell>
                  <Table.Cell>
                    {payment.user?.firstName} {payment.user?.lastName}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => handlePageChange(newPage)}
            />
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-10">No delayed payments found</div>
      )}
    </div>
  );
};

export default DelayedPaymentTable;
