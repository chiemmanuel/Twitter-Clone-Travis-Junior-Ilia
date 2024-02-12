const AppStateReducer = (state, action) => {
  switch (action.type) {
    case "Login": {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...action.payload, isAuthenticated: true })
      );

      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };
    }

    case "Logout": {
      localStorage.removeItem("user");
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    }
    default:
      return state;

    case "Connect": {
        return {
            ...state,
            isSocketConnected: true,
        };
        }

    case "Disconnect": {
        return {
            ...state,
            isSocketConnected: false,
        };
    }
}
};

export default AppStateReducer;
