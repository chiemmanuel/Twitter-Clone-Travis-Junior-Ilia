const AppStateReducer = (state, action) => {
  switch (action.type) {
    case "Login": {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...action.payload,
          isAuthenticated: true,
        })
        );

      console.log("Login", action.payload);

      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };
    }

    case "Logout": {
      console.log("Logout");
      localStorage.removeItem("user");
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    }

    default:
      return state;
}
};

export default AppStateReducer;
