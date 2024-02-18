import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppStateContext from "../hooks/useAppStateContext";
import instance from '../constants/axios';
import socket from "../socket";
import { requests } from "../constants/requests";

const LogoutPage = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppStateContext();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = async () => {
    try {
      // Use Axios instance for making the logout request
      const response = await instance.post(requests.logout,{}, {
        headers: {
          'Authorization': `Bearer ${user.token}`, // Include necessary headers
        },
      });

      if (response.status === 200) {
        socket.emit('userLogout', user.email);
        dispatch({
          type: "Logout",
        });
        socket.disconnect();
        console.log('User logged out successfully');
        navigate('/', { replace: true });
      } else {
        console.error('Failed to log out user');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    handleLogout();
  }, []);

  return (
    <div className="logout-page">
      <h1>Logging out...</h1>
    </div>
  );
};

export default LogoutPage;
