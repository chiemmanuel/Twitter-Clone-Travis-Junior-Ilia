import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../constants/axios";
import { requests } from "../constants/requests";
import useAppStateContext from "../hooks/useAppStateContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "../styles/Editpassword.css";

const EditPassword = ({ onClose }) => {
  const navigate = useNavigate();
  const { dispatch } = useAppStateContext();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");

  const togglePassword = (field) => {
    switch (field) {
      case "old":
        setShowOldPass(!showOldPass);
        break;
      case "new":
        setShowNewPass(!showNewPass);
        break;
      case "confirm":
        setShowConfirmPass(!showConfirmPass);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await instance.put(
        requests.editPassword,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        }
      );
      if (response.status === 200) {
        dispatch({ type: "password updated" });
        onClose();
        navigate("/profile");
      }
      if (response.status === 400) {
        setError(response.data);
        console.log(response.data);
      }
    } catch (error) {
      setError("Failed to change password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="password-form">
      <span className="close-button" onClick={onClose}>
        <FontAwesomeIcon icon={faTimes} />
      </span>
      <h2 className="password-title">Change Password</h2>
      <div className="password-input-container">
        <input
          type={showOldPass ? "text" : "password"}
          placeholder="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="password-input"
        />
        <span onClick={() => togglePassword("old")} className="toggle-password">
          {showOldPass ? (
            <FontAwesomeIcon icon={faEye} />
          ) : (
            <FontAwesomeIcon icon={faEyeSlash} />
          )}
        </span>
      </div>
      <div className="password-input-container">
        <input
          type={showNewPass ? "text" : "password"}
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="password-input"
        />
        <span onClick={() => togglePassword("new")} className="toggle-password">
          {showNewPass ? (
            <FontAwesomeIcon icon={faEye} />
          ) : (
            <FontAwesomeIcon icon={faEyeSlash} />
          )}
        </span>
      </div>
      <div className="password-input-container">
        <input
          type={showConfirmPass ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="password-input"
        />
        <span onClick={() => togglePassword("confirm")} className="toggle-password">
          {showConfirmPass ? (
            <FontAwesomeIcon icon={faEye} />
          ) : (
            <FontAwesomeIcon icon={faEyeSlash} />
          )}
        </span>
      </div>
      <button type="submit" className="password-submit">
        Change Password
      </button>
      {error && <p className="password-error">{error}</p>}
    </form>
  );
};

export default EditPassword;
