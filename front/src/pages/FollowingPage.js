import React, { useState, useEffect } from 'react'
import axios from '../constants/axios';
import { requests } from "../constants/requests";
import Navbar from '../components/Navbar';
import User from '../components/User';
import '../styles/Home.css';
import '../styles/Followers.css';
import { useParams } from 'react-router';

const FollowingPage = () => {
  const { user_email } = useParams();
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    const getFollowers = async () => {
      const res = await axios.get(requests.getFollowers + 'it@it.com', {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
        },
      });
      setFollowers(res.data.followers);
    };

    getFollowers();

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

export default FollowingPage;
