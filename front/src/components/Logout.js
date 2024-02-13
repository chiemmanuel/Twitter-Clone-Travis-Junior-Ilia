import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import instance from '../constants/axios'; // Import the Axios instance
import "../styles/LogoutPage.css";

const LogoutPage = ({ requests }) => {
  const [logoutStatus, setLogoutStatus] = useState(false);
  const history = useHistory();

  const handleLogout = async () => {
    try {
      // Use Axios instance for making the logout request
      const response = await instance.post(requests.logout, {
        headers: {
          'Authorization': `Bearer ${user.token}`, // Include necessary headers
        },
      });

      if (response.status === 200) {
        console.log('User logged out successfully');
        setLogoutStatus(true);
        history.push('/Base');
      } else {
        console.error('Failed to log out user');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="logout-container">
      <div className="logout-wrapper">
        <div className="logout-buttons">
          <button
            id="logoutButton"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
