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

    case "UpdateProfileImage": {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...state.user,
          profile_img: action.payload,
        })
        );
      return {
        ...state,
        user: {
          ...state.user,
          profile_img: action.payload,
        },
      };
    }

    case "UpdateUsername": {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...state.user,
          username: action.payload,
        })
        );
      return {
        ...state,
        user: {
          ...state.user,
          username: action.payload,
        },
      };
    }

    case "Follow": {
      const updatedUser = { ...state.user,
        following: [...state.user.following, action.payload],
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return {
        ...state,
        user: updatedUser,
      };
    }

    case "Unfollow": {
      const updatedUser = { ...state.user,
        following: state.user.following.filter((id) => id !== action.payload),
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return {
        ...state,
        user: updatedUser,
      };
    }

    default:
      return state;
}
};

export default AppStateReducer;
