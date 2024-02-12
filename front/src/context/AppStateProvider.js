import { createContext, useReducer } from "react";
import AppStateReducer from "./AppStateReducer";
import  socket  from "../socket.js";

const INITIAL_STATE = {
  isAuthenticated: localStorage.getItem("user") ? true : false,
  isSocketConnected: socket.connected,
  user: JSON.parse(localStorage.getItem("user")),
};

export const AppStateContext = createContext(INITIAL_STATE);

export const AppStateProvider = ({ children }) => {
  console.log("AppStateProvider", children);
  const [state, dispatch] = useReducer(AppStateReducer, INITIAL_STATE);

  return (
    <AppStateContext.Provider value={{ appState: state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};
