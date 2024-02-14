import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../constants/axios";
import { requests } from "../constants/requests";
import useAppStateContext from "../hooks/useAppStateContext";

const LoginForm = () => {
  const { dispatch } = useAppStateContext();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const togglePassword = (event) => {
    event.preventDefault();
    setShowPass(!showPass);
  };

  const authentication = (event) => {
    event.preventDefault();
  
    if (!email || !password) {
      setMessage("Please fill all required fields");
    } else {
      instance
        .post(requests.login, {
          email: email,
          password: password,
        })
        .then((response) => {
          const token = response.data.token;
          console.log("server response", response.data);
  
          if (token) {
            dispatch({
              type: "Login",
              payload: {
                token: token,
                email: email,
                username: response.data.username,
                _id: response.data._id,
              },
            });
            navigate("/home");
          } else {
            setMessage("Unexpected response from the server");
          }
        })
        .catch((error) => {
          console.log(error);
  
          // Check if error.response is available
          if (error.response) {
            setMessage(error.response.data.message || "An unexpected error occurred");
          } else {
            setMessage("Network error or server is unreachable");
          }
        });
    }
  };  

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (password) {
      setPassword("");
    }
  };

  return (
    <div className="login-container">
      <label className="email">Email</label>
      <input
        type="text"
        className="email-input"
        value={email}
        onChange={(e) => handleEmailChange(e)}
      />
      {email && (
        <React.Fragment>
          <label className="password">Password</label>
          <input
            type={showPass ? "text" : "password"}
            className="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={(e) => togglePassword(e)} className="toggle-password">
            <span>
              {showPass ? (
                <FontAwesomeIcon icon={faEye} className="customIcon" />
              ) : (
                <FontAwesomeIcon icon={faEyeSlash} className="customIcon" />
              )}
            </span>
          </span>
        </React.Fragment>
      )}
      <button className="submit" onClick={(e) => authentication(e)}>
        Next
      </button>
      <a href="/signup" className="signup-link">
        Sign Up
      </a>
      <span className="error-message">
        {message}
      </span>
    </div>
  );
};
export default LoginForm;
