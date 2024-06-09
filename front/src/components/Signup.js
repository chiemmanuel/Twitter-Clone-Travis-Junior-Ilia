// SignUp.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../constants/axios";
import { requests } from "../constants/requests";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useAppStateContext from "../hooks/useAppStateContext";
import "../styles/Signup.css";


const SignUp = ({ onClose, showLoginForm }) => {
  const { dispatch } = useAppStateContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState({
    email: "",
    username: "",
    password: "",
    dob: "",
    bio: "",
    gender: "",
    contact: "",
  });
  const [showPass, setShowPass] = useState(false);

  const togglePassword = (event) => {
    event.preventDefault();
    setShowPass(!showPass);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    try {
      // Validate required fields
      if (!fields.email || !fields.username || !fields.password || !fields.dob) {
        setMessage("Please fill all required fields");
        return;
      }

      // Check password length
      if (fields.password.length < 8) {
        setMessage("Password must be at least 8 characters long");
        return;
      }

      // Send request to server for each step
      const response = await instance.post(requests.signup, {
        ...fields,
        bio: step >= 4 ? fields.bio : undefined,
        gender: step >= 5 ? fields.gender : undefined,
        contact: step === 6 ? fields.contact : undefined,
      });

      // Handle success
      setMessage(response.data.message);

      // Automatically log in the user after successful signup
      const loginResponse = await instance.post(requests.login, {
        email: fields.email,
        password: fields.password,
      });

      dispatch({
        type: "Login",
        payload:{
          token: loginResponse.data.token,
          email: loginResponse.data.email,
          _id: loginResponse.data._id,
          username: loginResponse.data.username,
          profile_img: loginResponse.data.profile_img,
          following: loginResponse.data.following,
        },
      });

      // Redirect to home or profile page
      navigate("/home");
    } catch (error) {
      console.error("Error during signup", error);
      setMessage(error.response?.data?.message || "An unexpected error occurred");
    }
  };

  const handleNext = (event) => {
    event.preventDefault();
    setMessage("");

    // Validate required fields based on the step
    if (step === 1 && !fields.email ) {
      setMessage("Please enter your email");
      return;
    } else if (step === 2 && !fields.username) {
      setMessage("Please enter your username");
      return;
    } else if (step === 3 && !fields.password) {
      setMessage("Please enter your password");
      return;
    } else if (step === 4 && !fields.dob) {
      setMessage("Please fill all required fields");
      return;
    }

    // Move to the next step
    setStep((prevStep) => prevStep + 1);
  };

  const handleChange = (e, fieldName) => {
    setFields((prevFields) => ({ ...prevFields, [fieldName]: e.target.value }));
  };

  const handleLoginClick = () => {
    onClose();
    showLoginForm();
  };

  return (
    <div className="signup-container">
      <span className="close-button" onClick={onClose}>
        &#10006;
      </span>

      {step === 1 && (
        <>
          <label>Email</label>
          <input
            type="text"
            className="signup-input"
            value={fields.email}
            onChange={(e) => handleChange(e, "email")}
          />
        </>
      )}

      {step === 2 && (
        <>
          <label>Username</label>
          <input
            type="text"
            className="signup-input"
            value={fields.username}
            onChange={(e) => handleChange(e, "username")}
          />
        </>
      )}

      {step === 3 && (
          <>
          <div className="password-container">
            <label>Password</label>
            <input
              type={showPass ? "text" : "password"}
              className="signup-input"
              value={fields.password}
              onChange={(e) => handleChange(e, "password")}
              minLength={8} // Add minLength attribute to enforce minimum length of 8 characters
            />
            <span onClick={togglePassword} className="toggle-password">
              <FontAwesomeIcon icon={showPass ? faEye : faEyeSlash} className="customIcon" />
            </span>
          </div>
          </>
        )}

      {step === 4 && (
        <>
          <label>Date of Birth</label>
          <input
            type="date"
            className="signup-input"
            value={fields.dob}
            onChange={(e) => handleChange(e, "dob")}
          />
        </>
      )}

      {step === 5 && (
        <>
          <label>Bio</label>
          <input
            type="text"
            className="signup-input"
            value={fields.bio}
            onChange={(e) => handleChange(e, "bio")}
          />
        </>
      )}

      {step === 6 && (
        <>
          <label>Gender</label>
          <input
            type="text"
            className="signup-input"
            value={fields.gender}
            onChange={(e) => handleChange(e, "gender")}
          />
        </>
      )}

      {step === 7 && (
        <>
          <label>Contact</label>
          <input
            type="text"
            className="signup-input"
            value={fields.contact}
            onChange={(e) => handleChange(e, "contact")}
          />
        </>
      )}

      <div className="signup-buttons">
      <button className="signup-back" onClick={() => setStep((prevStep) => prevStep - 1)} disabled={step === 1}>
        Previous
      </button>
      <button className="signup-next" onClick={step < 7 ? handleNext : handleSignUp} >
        {step === 7 ? "Sign Up" : "Next"}
      </button>
      </div>
      <span className="login-link" onClick={handleLoginClick}>
        Already have an account? Login
      </span>

      <span className="error-message">{message}</span>
    </div>
  );
};

export default SignUp;
