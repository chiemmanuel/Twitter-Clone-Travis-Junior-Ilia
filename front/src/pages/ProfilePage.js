// ProfilePage.js

import React, { useState, useEffect } from "react";
import instance from "../constants/axios";
import { requests } from "../constants/requests";
import UpdateProfile from "../components/Editprofile";
import Editpassword from "../components/Editpassword";
import Tweet from "../components/Tweet";
import "../styles/Profile.css";

const ProfilePage = () => {
  const [activeContainer, setActiveContainer] = useState("userTweets");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [userTweets, setUserTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
  };

  const handleCloseEditPassword = () => {
    setShowEditPassword(false);
  };

  const handleEditProfileClick = () => {
    setShowEditProfile(true);
  };

  const handleEditPasswordClick = () => {
    setShowEditPassword(true);
  };

  const handleContainerToggle = (container) => {
    setActiveContainer(container);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await instance.get(requests.currentUser, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        });
        setUser(response.data);

        // Fetch user tweets
        const tweetsResponse = await instance.get(requests.userTweet + response.data.email, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        });
        setUserTweets(tweetsResponse.data.tweets);

        // Fetch liked tweets
        const likedTweetsResponse = await instance.get(requests.userLikedTweets + response.data._id, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        });
        setLikedTweets(likedTweetsResponse.data.likedTweets);

        // Fetch user comments
        const commentsResponse = await instance.get(requests.userComments + response.data.username, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        });
        setUserComments(commentsResponse.data.comments);
      } catch (error) {
        console.log(error);
        setError("Error fetching user data");
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="profile-page">
      {error ? (
        <p>{error}</p>
      ) : user !== null ? (
        <>
          <div className="user-info-container">
            <div className="user-info">
              <img src={user.profile_img} alt="Profile" />
              <div className="user-details">
                <h2>{user.username}</h2>
                <p>
                  Joined since{" "}
                  {new Date(user.created_at).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="follower-info">
                  <p>{user.followers.length} followers</p>
                  <p>{user.following.length} following</p>
                </div>
              </div>
            </div>
            <div className="edit-options">
              <button className="edit-profile-button" onClick={handleEditProfileClick}>
                Edit Profile
              </button>
              <button className="edit-password-button" onClick={handleEditPasswordClick}>
                Edit Password
              </button>
            </div>
          </div>

          {showEditProfile && <UpdateProfile onClose={handleCloseEditProfile} />}
          {showEditPassword && <Editpassword onClose={handleCloseEditPassword} />}

          <div className="toggle-buttons">
            <button onClick={() => handleContainerToggle("userTweets")}>Tweets</button>
            <button onClick={() => handleContainerToggle("likedTweets")}>Liked Tweets</button>
            <button onClick={() => handleContainerToggle("userComments")}>Replies</button>
          </div>

          {activeContainer === "userTweets" && (
            <div className="user-tweets-container">
              {userTweets.length > 0 ? (
                userTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
              ) : (
                <p>No posts.</p>
              )}
            </div>
          )}

          {activeContainer === "likedTweets" && (
            <div className="user-tweets-container">
              <h3>Liked Tweets</h3>
              {likedTweets.length > 0 ? (
                likedTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
              ) : (
                <p>No liked tweets.</p>
              )}
            </div>
          )}

          {activeContainer === "userComments" && (
            <div className="user-comments-container">
              <h3>Comments</h3>
              {userComments.length > 0 ? (
                userComments.map((comment) => <Tweet key={comment._id} tweet={comment} />)
              ) : (
                <p>No comments.</p>
              )}
            </div>
          )}
        </>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default ProfilePage;
