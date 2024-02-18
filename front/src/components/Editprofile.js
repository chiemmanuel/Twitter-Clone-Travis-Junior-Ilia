import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../constants/axios";
import { requests } from "../constants/requests";
import useAppStateContext from "../hooks/useAppStateContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import "../styles/Editprofile.css";

const cldUploadApi = "https://api.cloudinary.com/v1_1/dqqel2q07/image/upload";

const UpdateProfile = ({ onClose, onUpdateSuccess }) => {
  const navigate = useNavigate();
  const { dispatch } = useAppStateContext();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true);
  const [previewURL, setPreviewURL] = useState(null);

  const handleChange = (e, fieldName) => {
    setFormData((prevData) => ({ ...prevData, [fieldName]: e.target.value }));
    setIsNextButtonDisabled(e.target.value === "");
  };

  const handleImageUpdate = async (img) => {
    const profile_img = new FormData();
    profile_img.append('file', img);
    profile_img.append('upload_preset', 'dkp3udd5');

    const res = await fetch(
      cldUploadApi,
        {
          method: 'POST',
          body: profile_img
        }
    );
    const imgData = await res.json();

    setFormData((prevData) => ({ ...prevData, ['profile_img']: imgData.url }));
  };

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handleSkip = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Make the request to the backend to update user profile
      const response = await instance.put(requests.editProfile, formData, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
        },
      });

      if (response.status === 200) {
        // Close the update profile form and trigger a callback for update success
        dispatch({ type: "profileUpdated" });
        console.log('User profile updated successfully')
        onClose();
        navigate("/profile");
      } else {
        // Handle other status codes or error messages from the backend
        setErrorMessage(
          response.data.error || "Failed to update user information"
        );
      }
    } catch (error) {
      console.error("Error while updating user profile", error.message);
      setErrorMessage("Failed to update user information");
    }
  };

  const renderFormStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <label className="update-profile-label">Username</label>
            <input
              className="update-profile-input"
              type="text"
              value={formData.username || ""}
              onChange={(e) => handleChange(e, "username")}
            />
            <button
              className="update-profile-button"
              type="button"
              onClick={handleNext}
              disabled={isNextButtonDisabled}
            >
              Next
            </button>
            <button
              className="update-profile-button"
              type="button"
              onClick={handleSkip}
            >
              Skip
            </button>
          </>
        );
      case 1:
        return (
          <>
            <label className="update-profile-label">Profile Image URL</label>
            {previewURL && <img src={previewURL} alt="media" className='img-preview'/>}
            <input
              type="file"
              title='AAAAAAa'
              onChange={(e) => {
                handleImageUpdate(e.target.files[0]);
                setPreviewURL(URL.createObjectURL(e.target.files[0]))
              }}
            />
            <button
              className="update-profile-button"
              type="button"
              onClick={handleNext}
              disabled={isNextButtonDisabled}
            >
              Next
            </button>
            <button
              className="update-profile-button"
              type="button"
              onClick={handleSkip}
            >
              Skip
            </button>
          </>
        );
      case 2:
        return (
          <>
            <label className="update-profile-label">Bio</label>
            <textarea
              className="update-profile-textarea"
              value={formData.bio || ""}
              onChange={(e) => handleChange(e, "bio")}
            />
            <button
              className="update-profile-button"
              type="button"
              onClick={handleNext}
              disabled={isNextButtonDisabled}
            >
              Next
            </button>
            <button
              className="update-profile-button"
              type="button"
              onClick={handleSkip}
            >
              Skip
            </button>
          </>
        );
      case 3:
        return (
          <>
            <label className="update-profile-label">Gender</label>
            <input
              className="update-profile-input"
              type="text"
              value={formData.gender || ""}
              onChange={(e) => handleChange(e, "gender")}
            />
            <button
              className="update-profile-button"
              type="button"
              onClick={handleNext}
              disabled={isNextButtonDisabled}
            >
              Next
            </button>
            <button
              className="update-profile-button"
              type="button"
              onClick={handleSkip}
            >
              Skip
            </button>
          </>
        );
      case 4:
        return (
          <>
            <label className="update-profile-label">Date of Birth</label>
            <input
              className="update-profile-input"
              type="date"
              value={formData.dob || ""}
              onChange={(e) => handleChange(e, "dob")}
            />
            <button
              className="update-profile-button"
              type="button"
              onClick={handleNext}
              disabled={isNextButtonDisabled}
            >
              Next
            </button>
            <button
              className="update-profile-button"
              type="button"
              onClick={handleSkip}
            >
              Skip
            </button>
          </>
        );
      case 5:
        return (
          <>
            <label className="update-profile-label">Contact</label>
            <input
              className="update-profile-input"
              type="text"
              value={formData.contact || ""}
              onChange={(e) => handleChange(e, "contact")}
            />
            <button
              className="update-profile-button"
              type="button"
              onClick={handleNext}
              disabled={isNextButtonDisabled}
            >
              Next
            </button>
            <button
              className="update-profile-button"
              type="button"
              onClick={handleSkip}
            >
              Skip
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="update-profile-container">
      <span className="close-button" onClick={onClose}>
        <FontAwesomeIcon icon={faTimes} />
      </span>

      <form className="update-profile-form">{renderFormStep()}</form>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {step === 6 && (
        <button
          className="update-profile-button"
          type="submit"
          onClick={handleSubmit}
        >
          Update Profile
        </button>
      )}
    </div>
  );
};

export default UpdateProfile;
