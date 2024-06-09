import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import instance from "../constants/axios";
import { requests } from "../constants/requests";
import Tweet from "../components/Tweet";
import Comment from "../components/Comment";
import Navbar from "../components/Navbar";
import "../styles/Userprofile.css";
import { useNavigate } from 'react-router-dom';
import useAppStateContext from "../hooks/useAppStateContext";

const Userprofile = () => {
  const { dispatch } = useAppStateContext();
  const { username } = useParams();
  const [activeContainer, setActiveContainer] = useState("userTweets");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [userTweets, setUserTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [followSuccess, setFollowSuccess] = useState(false);
  const [unfollowSuccess, setUnfollowSuccess] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // Function to handle container toggle
  const handleContainerToggle = (container) => {
    setActiveContainer(container);
  };

  // Function to handle follow
  const handleFollow = async () => {
    try {
      // Make a request to follow the user
      await instance.post(requests.followUser + user.email, {}, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
        },
      });
      dispatch ({
        type: "Follow",
        payload: user.email,
      });
      setIsFollowing(true);
      setFollowSuccess(true);
      setSuccessMessage(`Successfully followed ${username}!`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {

      console.error(error);
      // Handle error
    }
  };

  // Function to handle unfollow
  const handleUnfollow = async () => {
    try {
      // Make a request to unfollow the user
      await instance.delete(requests.unFollowUser + user.email, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
        },
      });
      dispatch ({
        type: "Unfollow",
        payload: user.email,
      });
      setIsFollowing(false);
      setUnfollowSuccess(true);
      setSuccessMessage(`Successfully unfollowed ${username}!`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error(error);
      // Handle error
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const response = await instance.get(requests.userByUsername + username, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        });

        if (isMounted) {
          setUser(response.data);
          const currentUser = JSON.parse(localStorage.getItem("user"));
          setIsFollowing(currentUser.following.includes(response.data.email));

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
          setLikedTweets(likedTweetsResponse.data.tweets);

          // Fetch user comments
          const commentsResponse = await instance.get(requests.userComments + response.data.username, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
            },
          });
          setUserComments(commentsResponse.data.comments);
        }
      } catch (error) {
        console.log(error);
        // console.error(error);
        // if (isMounted) {
        //   setError("An error occurred while fetching user data");
        // }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [username, followSuccess, unfollowSuccess]);

  return (
    <div className="page">
      <div className='header'>
        <Navbar />
      </div>
      <div className='main'>
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
                    <div className="ff" onClick={()=>navigate(`/followers/${user.username}`)}>{user.followers} followers</div>
                    <div className="ff" onClick={()=>navigate(`/following/${user.username}`)}>{user.following} following</div>
                  </div>
                </div>
              </div>
              <div className="follow-buttons">
                {!user.isCurrentUser && !isFollowing && (
                  <button onClick={handleFollow}>Follow</button>
                )}
                {!user.isCurrentUser && isFollowing && (
                  <button onClick={handleUnfollow}>Unfollow</button>
                )}
              </div>
            </div>

            <div className="toggle-buttons">
              <button className={`toggle-button ${activeContainer === "userTweets" && "active"}`} onClick={() => handleContainerToggle("userTweets")}>Tweets</button>
              <button className={`toggle-button ${activeContainer === "likedTweets" && "active"}`} onClick={() => handleContainerToggle("likedTweets")}>Liked Tweets</button>
              <button className={`toggle-button ${activeContainer === "userComments" && "active"}`} onClick={() => handleContainerToggle("userComments")}>Replies</button>
            </div>

            {activeContainer === "userTweets" && (
              <div className="user-tweets-container">
                {userTweets.length > 0 ? (
                  userTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
                ) : (
                  <div>
                    <h2>This user hasn't posted anything yet</h2>
                    <p>When they do, it’ll show up here.</p>
                  </div>
                )}
              </div>
            )}

            {activeContainer === "likedTweets" && (
              <div className="user-tweets-container">
                {likedTweets?.length > 0 ? (
                  likedTweets.map((tweet) => <Tweet key={tweet._id} tweet={tweet} />)
                ) : (
                  <div>
                    <h2>This user hasn't liked any post yet</h2>
                    <p>When they do, it’ll show up here.</p>
                  </div>
                )}
              </div>
            )}

            {activeContainer === "userComments" && (
              <div className="user-comments-container">
                {userComments.length > 0 ? (
                  userComments.map((comment) => <Comment key={comment._id} comment={comment} />)
                ) : (
                  <div>
                    <h2>This user hasn't replied to any post yet</h2>
                    <p>When they do, it’ll show up here.</p>
                  </div>
                )}
              </div>
            )}

            {successMessage && (
              <div className="success-message">
                <p>{successMessage}</p>
              </div>
            )}
          </>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </div>
  );
};

export default Userprofile;
