// BasePage.js
import React, { useState } from "react";
import LoginForm from "../components/Login";
import SignUp from "../components/Signup";
import "../styles/Base.css";

const BasePage = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleCloseLoginForm = () => {
    setShowLoginForm(false);
  };
  const handleCloseSignUpForm = () => {
    setShowSignUp(false);
  };

  const handleSignInClick = () => {
    setShowLoginForm(true);
    setShowSignUp(false);
  };

  const handleSignUpClick = () => {
    setShowLoginForm(false);
    setShowSignUp(true);
  };

  return (
    <div className="base-page">
      <h1>Twitter/X Project</h1>
      <h3>Bare with us, we had just one month.</h3>
      <div className="form-switch">
        <button className={`login-button ${showLoginForm ? "active" : ""}`} onClick={handleSignInClick}>
          Sign In
        </button>
        <button className={`register-button ${!showLoginForm ? "active" : ""}`} onClick={handleSignUpClick}>
          Sign Up
        </button>
      </div>
      {showLoginForm && (
      <div className="overlay">
      <div className="popup">
        <LoginForm onClose={handleCloseLoginForm} showSignUpForm={() => setShowSignUp(true)} />
        </div>
        </div>)}
      {showSignUp && (
        <div className="overlay">
        <div className="popup">
      <SignUp onClose={handleCloseSignUpForm} showLoginForm={() => setShowLoginForm(true)}/>
      </div>
      </div>)}
    </div>
  );
};

export default BasePage;
