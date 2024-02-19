import React, { useState, useEffect } from 'react'
import axios from '../constants/axios';
import { requests } from "../constants/requests";
import Navbar from '../components/Navbar';
import User from '../components/User';
import '../styles/Home.css';
import '../styles/Followers.css';
import { useParams } from 'react-router';

const FollowersPage = () => {
  const { username } = useParams();
  const { user_email } = useParams();
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    const fetchInfo = async () => {
      const response = await axios.get(requests.userByUsername + username, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
        },
      });

      const getFollowers = async () => {
        const res = await axios.get(requests.getFollowers + response.data.email, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        });
        setFollowers(res.data.followers);
      };

      getFollowers();
    }

    fetchInfo();

  }, [user_email]);

  return (
    <div className='home'>
      <div className='header'>
        <Navbar />
      </div>

      <div className='main'>
        <div className='followers-list'>
        {followers.length > 0 ? (
            followers.map((follower) => <User user={follower}/>)
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

export default FollowersPage;
