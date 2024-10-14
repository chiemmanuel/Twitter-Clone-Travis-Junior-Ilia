import React, { useState, useEffect } from 'react';
import axios from '../constants/axios';
import { requests } from "../constants/requests";
import Navbar from '../components/Navbar';
import User from '../components/User';
import '../styles/Home.css';
import '../styles/Followers.css';
import { useParams } from 'react-router';

const FollowingPage = () => {
  const { username } = useParams();
  const [following, setFollowers] = useState([]);

  const current_user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchInfo = async () => {
      const response = await axios.get(requests.userByUsername + username, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
        },
      });

      const getFollowers = async () => {
        const res = await axios.get(requests.getFollowing + response.data.email, {
          headers: {
            Authorization: `Bearer ${current_user.token}`,
          },
        });
        console.log(res.data);
        setFollowers(res.data.followings);
      };

      getFollowers();
    }

    fetchInfo();

  }, [username]);

  return (
    <div className='home'>
      <div className='header'>
        <Navbar />
      </div>

      <div className='main'>
        <div className='followers-list'>
        {following.length > 0 ? (
            following.map((follower) => <User user={follower}/>)
          ) : (
            <p>No followers</p>
          )}
        </div>

        <div className=''>

        </div>
      </div>
    </div>
  );
}

export default FollowingPage;
