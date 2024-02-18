// LoginForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../constants/axios";
import { requests } from "../constants/requests";
import useAppStateContext from "../hooks/useAppStateContext";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/Login.css";

const LoginForm = ({ onClose, showSignUpForm }) => {
  const { dispatch } = useAppStateContext();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const togglePassword = (event) => {
    event.preventDefault();
    setShowPass(!showPass);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (password) {
      setPassword("");
    }
  };

  const handleNextClick = () => {
    if (currentStep === 1 && email.trim() !== "") {
      setCurrentStep(2);
    } else if (currentStep === 2 && password.trim() !== "") {
      authenticate();
    }
  };

  const authenticate = () => {
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

          if (token) {
            dispatch({
              type: "Login",
              payload: {
                token: token,
                email: email,
                _id: response.data._id,
                username: response.data.username,
              },
            });
            navigate("/home");
          } else {
            setMessage("Unexpected response from the server");
          }
        })
        .catch((error) => {
          if (error.response) {
            setMessage(error.response.data.message || "An unexpected error occurred");
          } else {
            setMessage("Network error or server is unreachable");
          }
        });
    }
  };

  const handleSignUpClick = () => {
    onClose();
    showSignUpForm();
  };

  return (
    <div className="login-container">
      {currentStep === 1 && (
        <>
          <label className="email">Email</label>
          <input
            type="text"
            className="email-input"
            value={email}
            onChange={(e) => handleEmailChange(e)}
          />
        </>
      )}

      {currentStep === 2 && (
        <>
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
        </>
      )}

      <button className="submit" onClick={handleNextClick}>
        {currentStep === 1 ? "Next" : "Sign In"}
      </button>
      <span className="signup-link" onClick={handleSignUpClick}>
        Sign Up
      </span>
      <span className="error-message">{message}</span>
      <span className="close-button" onClick={onClose}>
        &#10006;
      </span>
    </div>
  );
};

export default LoginForm;
