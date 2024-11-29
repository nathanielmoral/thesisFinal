import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import { fetchUserDetails } from '../api/user'; 
import { getBreadcrumbs } from '../helpers/breadcrumbsHelper';
import { fetchApprovedUsers, fetchPendingUsers, fetchApprovedUsersCountByGender } from '../api/user'; 
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);
import {  FaMoneyCheckAlt ,FaUsers,FaUserClock, FaMale, FaFemale, FaWarehouse, FaHouseUser } from 'react-icons/fa';
import axios from 'axios'

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const [totalApprovedPayments, setTotalApprovedPayments] = useState(0);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedMaleUsers, setApprovedMaleUsers] = useState(0);
    const [approvedFemaleUsers, setApprovedFemaleUsers] = useState(0);
    const location = useLocation();
    const [chartData, setChartData] = useState({
        labels: [], 
        datasets: [], 
    });
    const [occupancyStatus, setOccupancyStatus] = useState({
        occupied: 0,
        unoccupied: 0,
    });
    const crumbs = getBreadcrumbs(location);
    

        // Fetch total approved payments
        useEffect(() => {
            const fetchTotalApprovedPayments = async () => {
            try {
                const response = await axios.get('/api/payments/total-approved');
                setTotalApprovedPayments(response.data.totalApproved || 0); 
            } catch (error) {
                console.error('Failed to fetch total approved payments:', error);
            }
            };

            fetchTotalApprovedPayments();
        }, []);


    useEffect(() => {
        const fetchOccupancyStatus = async () => {
            try {
                const response = await axios.get("/api/blocks-lots/occupancy-status");
                setOccupancyStatus(response.data);
            } catch (error) {
                console.error("Error fetching block occupancy status:", error);
            }
        };

        fetchOccupancyStatus();
    }, []);

    useEffect(() => {
        const getUserDetails = async () => {
          try {
            const data = await fetchUserDetails();
            if (data && data.id) {
              setUser(data);  
            } else {
              console.error("Fetched user data does not include an ID");
            }
          } catch (err) {
            console.error('Error fetching user details:', err);
          }
        };
      
        getUserDetails();
      }, []);
      
    useEffect(() => {
        const firstLogin = localStorage.getItem('firstLogin');
        if (!firstLogin) {
            setIsFirstLogin(true);
            localStorage.setItem('firstLogin', 'true');
        } else {
            setIsFirstLogin(false);
        }
    }, []);

    //fetch users for calculation of block and lot
    useEffect(() => {
        const getApprovedUsers = async () => {
            try {
                const users = await fetchApprovedUsers();
                setApprovedUsers(users);

                // Group users by block and lot to calculate the number of families
                const familiesPerBlockAndLot = groupFamiliesByBlockAndLot(users);
                const chartData = prepareChartData(familiesPerBlockAndLot);
                setChartData(chartData);
            } catch (error) {
                console.error('Failed to fetch approved users:', error);
            }
        };

        getApprovedUsers();
    }, []);

    // Fetch pending users
    useEffect(() => {
        const getPendingUsers = async () => {
            try {
                const users = await fetchPendingUsers();
                setPendingUsers(users);
            } catch (error) {
                console.error('Failed to fetch pending users:', error);
            }
        };

        getPendingUsers();
    }, []);

    // Fetch gender-based user count
    useEffect(() => {
        const getApprovedUsersCountByGender = async () => {
            try {
                const response = await fetchApprovedUsersCountByGender();
                const { male = 0, female = 0 } = response;
                setApprovedMaleUsers(male);
                setApprovedFemaleUsers(female);
            } catch (error) {
                console.error('Failed to fetch approved users count by gender:', error);
            }
        };

        getApprovedUsersCountByGender();
    }, []);

   // Group families by block and lot
const groupFamiliesByBlockAndLot = (users) => {
    const families = users.reduce((acc, user) => {
        const key = `${user.block}`; // Group by block only
        if (!acc[key]) {
            acc[key] = {
                block: user.block,
                familyCount: 1 // Start with 1 family
            };
        } else {
            acc[key].familyCount += 1; // Increment family count for this block
        }
        return acc;
    }, {});

    // Convert object to array for easier manipulation
    return Object.values(families);
};

// Prepare the chart data based on families per block
const prepareChartData = (familiesPerBlock) => {
    const blocks = familiesPerBlock.map(family => family.block);
    const familyCounts = familiesPerBlock.map(family => family.familyCount);

    return {
        labels: blocks.map(block => `Block ${block}`), // Add "Block" label for better readability
        datasets: [
            {
                label: 'Number of Families',
                data: familyCounts, // Number of families in each block
                backgroundColor: blocks.map((_, index) => `rgba(255, ${150 + index * 20}, ${100 + index * 15}, 0.8)`), // Dynamic colors
                borderColor: blocks.map((_, index) => `rgba(255, ${150 + index * 20}, ${100 + index * 15}, 1)`),
                borderWidth: 1,
            },
        ],
    };
};


      // Helper function to capitalize the first letter of each word
      const capitalizeFirstLetter = (str) => {
        return str
            .toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const username = user?.username ? capitalizeFirstLetter(user.username) : 'Administrator';
    
    
    return (
        <div className="min-h-screen rounded-lg bg-[#FAFAFA] p-4">
            
            {/* Breadcrumbs Section */}
            <div className="bg-[#d4ae66] rounded-md mb-2">
                <Breadcrumbs crumbs={crumbs} />
            </div>

            {/* Welcome Section */}
            <div className="p-2 rounded-md mb-2">
                <h2 className="text-md font-semibold font-poppins text-[#333333] border-b-2 border-[#ff8c00] inline-block">
                    Welcome, {username}!
                </h2>
            </div>

            {/* Population Statistics */}
            <div className="bg-[#FAFAFA] rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                       {/* Approved Payments Card */}
                    <div className="bg-gradient-to-r from-[#FFAB41] to-[#FFD181] p-4 rounded-lg shadow-md flex items-center border border-[#E5E7EB]">
                        <FaMoneyCheckAlt className="text-4xl text-gray-800 mr-4" />
                        <div>
                        <h3 className="text-xl font-semibold text-gray-800">Total Payments</h3>
                        <p className="text-3xl text-gray-800 mt-2">PHP {totalApprovedPayments.toLocaleString()}</p>
                        <p className="text-gray-800">Total Amount</p>
                        </div>
                    </div>

                    {/* Population Card */}
                    <Link to="/users" className="flex">
                    <div className="bg-gradient-to-r from-[#FFAB41] to-[#FFD181] p-4 rounded-lg shadow-md flex-1 flex items-center cursor-pointer border border-[#E5E7EB]">
                        <div className="flex items-center justify-center mr-4">
                        <FaUsers className="text-4xl text-gray-800" /> </div>
                        <div className="flex flex-col items-start w-full">
                        <h3 className="text-xl font-semibold text-gray-800">Population</h3>
                        <p className="text-3xl text-gray-800 mt-2">{approvedUsers.length}</p>
                        <p className="text-gray-600">Total Users</p>
                        </div>
                    </div>
                    </Link>

                    <div className="flex">
                    <Link to="/AdminBlockAndLots" className="w-full">
                    <div className="bg-gradient-to-r from-[#FFAB41] to-[#FFD181] p-4 rounded-lg shadow-md flex-1 flex items-center border border-[#E5E7EB]">
                        <div className="flex items-center justify-center mr-4">
                        <FaHouseUser className="text-4xl text-gray-800" />
                        </div>
                        <div className="flex flex-col items-start w-full">
                        <h3 className="text-xl font-semibold text-gray-800">Occupied Blocks and Lots</h3>
                        <p className="text-3xl text-gray-800 mt-2">{occupancyStatus.occupied}</p>
                        <p className="text-gray-600">Total Occupied Blocks and Lots</p>
                        </div>
                    </div>
                    </Link>
                    </div>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
           
                    <div className="flex">
                    <Link to="/AdminBlockAndLots" className="w-full">
                    <div className="bg-gradient-to-r from-[#FFAB41] to-[#FFD181] p-4 rounded-lg shadow-md flex-1 flex items-center border border-[#E5E7EB]">
                        <div className="flex items-center justify-center mr-4">
                        <FaWarehouse className="text-4xl text-gray-800" />
                        </div>
                        <div className="flex flex-col items-start w-full">
                        <h3 className="text-xl font-semibold text-gray-800">Unoccupied Blocks and Lots</h3>
                        <p className="text-3xl text-gray-800 mt-2">{occupancyStatus.unoccupied}</p>
                        <p className="text-gray-600">Total Uoccupied Blocks and Lots</p>
                        </div>
                    </div>
                    </Link>
                    </div>
                        {/* Male Users Card */}
                        <div className="flex">
                    <div className="bg-gradient-to-r from-[#FFAB41] to-[#FFD181] p-4 rounded-lg shadow-md flex-1 flex items-center border border-[#E5E7EB]">
                        <div className="flex items-center justify-center mr-4">
                        <FaMale className="text-4xl text-gray-800" />
                        </div>
                        <div className="flex flex-col items-start w-full">
                        <h3 className="text-xl font-semibold text-gray-800">Male</h3>
                        <p className="text-3xl text-gray-800 mt-2">{approvedMaleUsers}</p>
                        <p className="text-gray-600">Total Male Users</p>
                        </div>
                    </div>
                    </div>

                    {/* Female Users Card */}
                    <div className="flex">
                    <div className="bg-gradient-to-r from-[#FFAB41] to-[#FFD181] p-4 rounded-lg shadow-md flex-1 flex items-center border border-[#E5E7EB]">
                        <div className="flex items-center justify-center mr-4">
                        <FaFemale className="text-4xl text-gray-800" />
                        </div>
                        <div className="flex flex-col items-start w-full">
                        <h3 className="text-xl font-semibold text-gray-800">Female</h3>
                        <p className="text-3xl text-gray-800 mt-2">{approvedFemaleUsers}</p>
                        <p className="text-gray-600">Total Female Users</p>
                        </div>
                    </div>
                    </div>
                   
                </div>
                </div>

        {/* Chart Section */}
        <div className="bg-white p-4 rounded-md shadow-md w-full md:w-1/2 lg:w-1/3 border border-[#E5E7EB] mx-auto ">
            <div className="w-full" style={{ height: '300px' }}>
                <Pie
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false, // Ensures responsiveness
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Number of Families per Block',
                            },
                        },
                    }}
                />
            </div>
        </div>

        </div>
    );
};

export default AdminDashboard;
