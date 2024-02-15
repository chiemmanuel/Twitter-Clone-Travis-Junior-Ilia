// BasePage.js
import React, { useState } from "react";
import LoginForm from "../components/Login";
import SignUp from "../components/Signup";
import "../styles/Base.css";

const BasePage = () => {
  const [showLoginForm, setShowLoginForm] = useState(true);
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
      <h1>Base page</h1>
      <div className="form-switch">
        <button className={`login-button ${showLoginForm ? "active" : ""}`} onClick={handleSignInClick}>
          Sign In
        </button>
        <button className={`register-button ${!showLoginForm ? "active" : ""}`} onClick={handleSignUpClick}>
          Sign Up
        </button>
      </div>
      {showLoginForm && <LoginForm onClose={handleCloseLoginForm} showSignUpForm={() => setShowSignUp(true)} />}
      {showSignUp && <SignUp onClose={handleCloseSignUpForm} showLoginForm={() => setShowLoginForm(true)}/>}
    </div>
  );
};

export default BasePage;
