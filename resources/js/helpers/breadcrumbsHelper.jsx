// Helper function to capitalize labels safely
const capitalize = (string) => string ? string.charAt(0).toUpperCase() + string.slice(1) : '';

const hierarchyMap = {
  'admin-dashboard': ['admin-dashboard'],
  'admin-announcements': ['admin-dashboard'],
  'users': ['admin-dashboard', 'settings', 'User'],
  'notification': ['admin-dashboard'],
  'resident-records': ['admin-dashboard', 'settings', 'User'],
  'board-of-directors': ['admin-dashboard', 'settings'],
  'profile': ['admin-dashboard'],
  'create-notification': ['admin-dashboard', 'Notifications'],
  'houselist': ['admin-dashboard', 'settings'],
  'family-details': ['admin-dashboard'],
  'MyProfile':['admin-dashboard', 'MyProfile'],
  'admin-info': ['admin-dashboard', 'MyProfile',],
  'admin-gallery': ['admin-dashboard'],
  'residentrecords': ['admin-dashboard', 'settings','User'],
  'Feedback': ['admin-dashboard', 'settings'],
  'AdminBlockAndLots': ['admin-dashboard', 'settings'],
  'AdminSettings': ['admin-dashboard', 'settings'],
  'AdminPaymentApproved': ['admin-dashboard'],
  'AdminPaymentDelayed': ['admin-dashboard'],
  'AdminPaymentProcess': ['admin-dashboard'],
};

const pathToNameMap = {
  'admin-dashboard': 'Dashboard',
  'admin-announcements': 'Announcements',
  'users': 'User List',
  'registrant': 'Applicants List',
  'notification': 'Notifications',
  'resident-records': 'Resident Records',
  'board-of-directors': 'Board of Directors',
  'profile': 'Profile',
  'create-notification': 'Create Notification',
  'houselist': 'House List',
  'family-details': 'Family Details',
  'MyProfile': 'My Profile',
  'admin-info': 'Admin Information',
  'admin-gallery': 'Admin Gallery',
  'residentrecords': 'Resident Records',
  'AdminBlockAndLots': 'Blocks & Lots',
  'AdminPaymentApproved': 'Approved Payments',
  'AdminSettings': 'Payment Settings',
  'AdminPaymentDelayed': 'Delayed Payments',
  'AdminPaymentProcess': 'Pending Payments',
};

export const getBreadcrumbs = (location) => {
  const pathnames = location.pathname.split('/').filter(Boolean);

  let breadcrumbs = [];
  let previousHierarchy = ['admin-dashboard']; // Start with dashboard

  pathnames.forEach(path => {
    if (hierarchyMap[path]) {
      hierarchyMap[path].forEach(h => {
        if (!breadcrumbs.some(crumb => crumb.path === `/${h}`)) {
          breadcrumbs.push({
            label: pathToNameMap[h] || capitalize(h?.replace(/-/g, ' ')), // Safely use capitalize
            path: `/${h}`
          });
          previousHierarchy.push(h); // Track hierarchy
        }
      });
    }
  });

  // Push the current path if not already in the hierarchy
  const lastPath = pathnames[pathnames.length - 1];
  const fullPath = `/${lastPath}`;
  if (!previousHierarchy.includes(lastPath) && !breadcrumbs.some(crumb => crumb.path === fullPath)) {
    breadcrumbs.push({
      label: pathToNameMap[lastPath] || capitalize(lastPath?.replace(/-/g, ' ')), // Safely use capitalize
      path: fullPath
    });
  }

  return breadcrumbs;
};
