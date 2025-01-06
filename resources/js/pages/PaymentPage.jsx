import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentPage = () => {
  const [accountNumber, setAccountNumber] = useState("");
  const [accountDetails, setAccountDetails] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [amountTendered, setAmountTendered] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("Over the Counter");
  const [totalAmount, setTotalAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAllChecked, setIsAllChecked] = useState(false);

  // Fetch users for React Select
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/fetch-account-holders");
        const options = response.data.map((user) => ({
          value: user.account_number,
          label: `${user.account_number} - ${user.firstName} ${user.lastName}`,
        }));
        setUsers(options);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);
  
  // Fetch account details when accountNumber changes
 // Fetch account details when accountNumber changes
 useEffect(() => {
  if (accountNumber) {
    const fetchAccountDetails = async () => {
      try {
        const response = await axios.post("/api/payment/account-details", {
          account_number: accountNumber.value, // Ensure only the value (string) is sent
        });
        setAccountDetails(response.data);
        setSelectedFees([]);
        setTotalAmount(0);
        setIsAllChecked(false);
        toast.success("Account details loaded successfully!");
      } catch (error) {
        toast.error(error.response?.data?.message || "Account not found.");
        setAccountDetails(null);
      }
    };

    fetchAccountDetails();
  } else {
    setAccountDetails(null);
  }
}, [accountNumber]);

  const handleFeeSelection = (fee, isChecked) => {
    let updatedFees = [...selectedFees];
    if (isChecked) {
      updatedFees.push(fee);
    } else {
      updatedFees = updatedFees.filter((f) => f.id !== fee.id);
    }
    setSelectedFees(updatedFees);

    // Calculate total amount
    const total = updatedFees.reduce((sum, f) => sum + parseFloat(f.fee.amount), 0);
    setTotalAmount(total);
  };
  const handlePayment = async () => {
    if (selectedFees.length === 0) {
      toast.warn("Please select at least one fee to pay.");
      return;
    }
  
    if (amountTendered < totalAmount) {
      toast.warn("Amount tendered is less than the total amount.");
      return;
    }
  
    try {
      // Extract the year from the first selected fee
      const year = accountDetails.fees.find((fee) => fee.id === selectedFees[0].id)?.year;
  
      if (!year) {
        toast.error("Unable to determine the year for the selected fees.");
        return;
      }
  
      // Send the request with the year included
      const response = await axios.post("/api/payment/transaction", {
        account_number: accountNumber.value, // Use accountNumber.value as a string
        fee_ids: selectedFees.map((fee) => fee.id),
        amount_tendered: amountTendered,
        mode_of_payment: modeOfPayment,
        year: year, // Include the year in the payload
      });
  
      setBalance(response.data.balance);
      toast.success(response.data.message || "Payment successful!");
      setAccountDetails(null);
      setSelectedFees([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed. Please try again.");
    }
  };
  

  const capitalize = (str) => {
    return str
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : "N/A";
  };
  
  const handleHeaderCheckbox = (e) => {
    const checked = e.target.checked;
    setIsAllChecked(checked);

    if (checked && accountDetails) {
      // Select all fees
      setSelectedFees(accountDetails.fees);
      const total = accountDetails.fees.reduce(
        (sum, fee) => sum + parseFloat(fee.fee.amount),
        0
      );
      setTotalAmount(total);
    } else {
      // Deselect all fees
      setSelectedFees([]);
      setTotalAmount(0);
    }
  };


  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
     <div className="mb-4">
        <Select
          options={users}
          value={accountNumber}
          onChange={setAccountNumber}
          placeholder="Select Account Number"
          isClearable
        />
      </div>
      
      {accountDetails && (
        <div className="mt-4">
          <div>
          <h2 className="text-lg font-semibold ">
          Account Holder:{" "}
          {capitalize(accountDetails.account_details.firstName)}{" "}
          {capitalize(accountDetails.account_details.middleName)}{" "}
          {capitalize(accountDetails.account_details.lastName)}
        </h2>
        </div>
       
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm text-center text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">
                  <input
                      type="checkbox"
                      checked={isAllChecked}
                      onChange={handleHeaderCheckbox}
                      className="p-2"
                    />
                  </th>
                  <th className="px-4 py-2">Fee</th>
                  <th className="px-4 py-2">Month</th>
                  <th className="px-4 py-2">Year</th>
                  <th className="px-4 py-2">Block</th>
                  <th className="px-4 py-2">Lot</th>
                  <th className="px-4 py-2">Amount (₱)</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {accountDetails.fees.map((fee) => (
                  <tr key={fee.id} className="bg-white border-b">
                    <td className="px-4 py-2 text-center">
                    <input
                        type="checkbox"
                        className="p-2"
                        checked={selectedFees.some((f) => f.id === fee.id)}
                        onChange={(e) =>
                          handleFeeSelection(fee, e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-4 py-2 text-center">{fee.fee.name}</td>
                    <td className="px-4 py-2 text-center">
                      {new Date(0, fee.month - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </td>
                    <td className="px-4 py-2 text-center">{fee.year}</td>
                    <td className="px-4 py-2 text-center">{fee.user?.block}</td>
                    <td className="px-4 py-2 text-center">{fee.user?.lot}</td>
                    <td className="px-4 py-2 text-center">{fee.fee.amount}</td>
                    <td className="px-4 py-2 text-center">{fee.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>
      {/* Total and Payment Section */}
      <div className="flex items-center justify-between mt-4">
            <p className="font-bold text-lg">
        Total Amount: <span className="text-black">₱{totalAmount.toFixed(2)}</span>
      </p>

      {/* Amount Tendered */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Amount Tendered:</label>
          <input
            type="number"
            value={amountTendered}
            onChange={(e) => setAmountTendered(e.target.value)}
            className="border p-2 rounded w-40"
          />
        </div>

            {/* Mode of Payment */}
            <div>
              <label className="block mb-1 text-sm font-medium">Mode of Payment:</label>
              <select
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                className="border p-2 rounded w-40"
              >
                <option value="Over the Counter">Over the Counter</option>
                <option value="GCash">GCash</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pay Now Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handlePayment}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition"
          >
            Pay Now
          </button>
        </div>

        {/* Balance Display */}
        {balance > 0 && (
          <p className="mt-4 text-green-600 font-bold text-right">
            Balance: ₱{balance.toFixed(2)}
          </p>
        )}
      </div>
    )}

      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
};

export default PaymentPage;
