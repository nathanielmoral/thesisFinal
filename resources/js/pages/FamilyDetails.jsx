import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { fetchDetailsFamily, fetchDetailsFamilyTenants, setAccountHolder } from '../api/user';
import Breadcrumbs from '../components/Breadcrumbs';
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import { ToastContainer, toast } from "react-toastify";
import BeatLoader from 'react-spinners/BeatLoader';
import "react-toastify/dist/ReactToastify.css";


const FamilyDetails = () => {
  const { id } = useParams();
  const [block, lot] = id ? id.split('-') : [null, null];
  const { state } = useLocation();
  const [family, setFamily] = useState(state?.family || null);
  const [tenants, setTenants] = useState({});
  const [currentAccountHolder, setCurrentAccountHolderState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const location = useLocation();
  const crumbs = getBreadcrumbs(location);

  // Helper function to get the current account holder from family data
  const getAccountHolder = (familyData) => {
    if (!familyData || !familyData.account_holder_id) return null;
    return familyData.members.find(member => member.id === familyData.account_holder_id) || null;
  };

  useEffect(() => {
    const loadFamilyDetails = async () => {
      if (!block || !lot) {
        setError("Block and Lot are undefined.");
        return;
      }

      setLoading(true); // Start loading
      setError(''); // Clear previous errors before loading new data
      try {
        const fetchedFamily = await fetchDetailsFamily(block, lot);
        const fetchedTenants = await fetchDetailsFamilyTenants(block, lot);

        if (fetchedFamily && typeof fetchedFamily === 'object') {
          setFamily(fetchedFamily); // Set the family data
          setTenants(fetchedTenants); 

          // Use the helper function to set the current account holder
          const accountHolder = getAccountHolder(fetchedFamily);
          setCurrentAccountHolderState(accountHolder ? accountHolder.id : null);

          setLoading(false); // End loading
        } else {
          setError('Invalid response format.');
          setLoading(false); // End loading on error
        }
      } catch (error) {
        console.error('Error loading family details:', error);
        setError('Error loading family details.');
        setLoading(false); // End loading on catch
      }
    };

    loadFamilyDetails();
  }, [block, lot]);

  const handleSetAccountHolder = async (newAccountHolderId) => {
    if (!family?.block || !family?.lot) {
      setError("Family Block and Lot are undefined.");
      return;
    }

    setLoading(true);
    setMessage(''); // Clear previous message
    setError(''); // Clear previous error
    

    try {
      const familyId = `${family.block}-${family.lot}`;
      await setAccountHolder(familyId, newAccountHolderId, currentAccountHolder);
      toast.success("Account holder updated successfully.");

      // Update the current account holder state
      setCurrentAccountHolderState(newAccountHolderId);

      // Re-fetch family details after updating account holder
      const updatedFamily = await fetchDetailsFamily(family.block, family.lot);
      const updatedTenants = await fetchDetailsFamilyTenants(family.block, family.lot);
      if (updatedFamily && typeof updatedFamily === 'object' && Array.isArray(updatedFamily.members)) {
        setFamily(updatedFamily);
        setTenants(updatedTenants); 

        // Use the helper function to update the account holder
        const accountHolder = getAccountHolder(updatedFamily);
        setCurrentAccountHolderState(accountHolder ? accountHolder.id : null);

        setError(''); // Clear error since we successfully updated and fetched new data
      } else {
        toast.error("Failed to reload updated family details.");
        setMessage(''); // Clear success message on error
      }
    } catch (error) {
      toast.error('Error updating account holder. Please try again.');
      setMessage(''); // Clear success message on catch
    } finally {
      setLoading(false);
    }
  };
  
  const changeAccountHolder = async (tenantId, tenantBirthdate) => {
    try {
      setLoading(true);
  
      // Check age limit
      const age = computeAge(tenantBirthdate);
      if (age < 18) {
        toast.error("Must be at least 18 years old to become the account holder", {
          position: "top-right",
          autoClose: 3000, // Optional: auto-close after 3 seconds
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLoading(false);
        return;
      }
  
      // Fetch tenant data
      const response = await fetch(`/api/user/tenants/holder/${tenantId}`, {
        method: "PUT",
      });
  
      if (!response.ok) {
        toast.error("Failed to update account holder", {
          position: "top-right",
          autoClose: 3000,
        });
        setLoading(false);
        return;
      }
  
      // Handle successful response
      const updatedFamily = await fetchDetailsFamily(family.block, family.lot);
      const updatedTenants = await fetchDetailsFamilyTenants(family.block, family.lot);
  
      if (updatedFamily && typeof updatedFamily === "object" && Array.isArray(updatedFamily.members)) {
        setFamily(updatedFamily);
        setTenants(updatedTenants);
  
        // Use the helper function to update the account holder
        const accountHolder = getAccountHolder(updatedFamily);
        setCurrentAccountHolderState(accountHolder ? accountHolder.id : null);
  
        toast.success("Account holder updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error("Failed to reload updated family details.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred while updating the account holder", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to compute age from birthdate
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
  

    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <BeatLoader color="#1D4ED8" size={15} />
        </div>
      );
    }

  return (
    <div className="min-h-screen relative overflow-x-auto shadow-md sm:rounded-md p-4 bg-[#FAFAFA]">
    <ToastContainer /> {/* Add ToastContainer here */}
    <div className="bg-white rounded-md mb-2">
      <Breadcrumbs crumbs={crumbs} />
    </div>

    <h1 className="text-left text-4xl font-poppins font-semibold p-4">Homeowner Details</h1>

    <div className="overflow-x-auto shadow-sm">
    <table className="table-auto min-w-full bg-white">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Fullname
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Gender
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Mobile Number
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Email
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Birthday
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Age
        </th>
        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Account Holder
        </th>
      </tr>
    </thead>
      <tbody className="bg-white divide-y divide-gray-200">
          {Array.isArray(family?.members) && family.members.length > 0 ? (
            family.members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.firstName} {member.middleName} {member.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{member.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.contact_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.birthdate}</td>
                <td className="px-6 py-4 whitespace-nowrap">{computeAge(member.birthdate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name="accountHolder"
                      id={`account-holder-${member.id}`}
                      value={member.id}
                      checked={currentAccountHolder === member.id}
                      onChange={() => handleSetAccountHolder(member.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                No members found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <h1 className="text-left text-4xl font-poppins font-semibold p-4 mt-10">Tenants Details</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
          <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Fullname
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Gender
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Mobile Number
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Email
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Block
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Lot
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Birthday
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Age
        </th>
        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Account Holder
        </th>
      </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(tenants?.tenants) && tenants.tenants.length > 0 ? (
              tenants.tenants.map((member) => (
                <tr key={member.id}>
                   <td className="px-6 py-4 whitespace-nowrap">
                   {member.firstName} {member.middleName} {member.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.gender}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.contact_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.email || "Not Provided"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.block}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.lot}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{member.birthdate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{computeAge(member.birthdate)}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <label className={`relative inline-flex items-center ${member.is_account_holder == 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                              type="checkbox"
                              className="sr-only"
                              checked={member.is_account_holder == 1}
                              disabled={member.is_account_holder == 1}
                              onChange={() => changeAccountHolder(member.id, member.birthdate)}
                          />
                          <span className={`w-11 h-6  rounded-full ${
                                  member.is_account_holder == 1 ? ' bg-green-600' : 'bg-gray-200'
                              }`}></span>
                          <span
                              className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                                  member.is_account_holder == 1 ? 'transform translate-x-5 bg-blue-600' : ''
                              }`}
                          ></span>
                      </label>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <div className="text-center">Updating account holder...</div>}
    </div>
  );
};

export default FamilyDetails;
