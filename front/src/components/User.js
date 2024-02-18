import { useState, useEffect } from 'react';
import { requests } from '../constants/requests';
import '../styles/User.css';
import axios from 'axios';

import logout_icon from '../icons/logout_icon.svg';

const User = ({ user }) => {
  const { _id, username, profile_img } = user;
  const { following } = JSON.parse(localStorage.getItem("user"));

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (following && following.includes(_id)) {
      setIsFollowing(true);
    }
  }, [following, _id]);

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await axios.delete('http://localhost:8080/followers/unfollow/' + _id,
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        }
      );
      setIsFollowing(false);
    } else {
      await axios.post('http://localhost:8080/followers/follow/' + _id, {},
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
          },
        }
      );
      setIsFollowing(true);
    }
  };

  return (
    <div className='user'>
      <div className='user-photo' style={{ backgroundImage: `url(${profile_img})` }}></div>
      <div className='info'>
        <span className='displayname'>{ username }</span>
        <span className='username'>@{ username }</span>
      </div>
      <div className='action'>
      {JSON.parse(localStorage.getItem("user"))._id !== _id ? (
        <button onClick={handleFollowToggle}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      ) : (
        <a href='/'><img src={logout_icon} alt=''></img></a>
      )}
      </div>
    </div>
  );
}

export default User;
