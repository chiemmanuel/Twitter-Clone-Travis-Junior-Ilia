import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAppStateContext from "../hooks/useAppStateContext";
import socket from "../socket";

const PrivateRoute = () => {
  const { appState } = useAppStateContext();

    if (appState?.isAuthenticated && appState?.user && !socket.connected) {
        socket.connect();
    }

  return appState?.isAuthenticated && appState?.user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;
