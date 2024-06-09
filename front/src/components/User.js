import { useState, useEffect } from 'react';
import { requests } from '../constants/requests';
import '../styles/User.css';
import instance from '../constants/axios';
import useAppStateContext from '../hooks/useAppStateContext';
import { useNavigate } from 'react-router-dom';

import logout_icon from '../icons/logout_icon.svg';

const User = ({ user }) => {
  const current_user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const { dispatch } = useAppStateContext();
  const { _id, username, profile_img, email } = user;
  const following = current_user.following;

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (following && following.includes(email)) {
      setIsFollowing(true);
    }
  }, [following, email]);

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (isFollowing) {
      await instance.delete('http://localhost:8080/followers/unfollow/' + email,
        {
          headers: {
            Authorization: `Bearer ${current_user.token}`,
          },
        }
      ).then((res) => {
        console.log(res.data);
        dispatch({ type: 'Unfollow', payload: email });
      }).catch((err) => {
        console.log(err);
      });
      setIsFollowing(false);
    } else {
      await instance.post('http://localhost:8080/followers/follow/' + email, {},
        {
          headers: {
            Authorization: `Bearer ${current_user.token}`,
          },
        }
      ).then((res) => {
        console.log(res.data);
        dispatch({ type: 'Follow', payload: email });
      }).catch((err) => {
        console.log(err);
      });
      setIsFollowing(true);
    }
  };

  return (
    <div className='user' onClick={email === current_user.email ? (() => navigate(`/profile`)) : (() => navigate(`/profile/${username}`))}>
      <div className='user-photo' style={{ backgroundImage: `url(${profile_img})` }}></div>
      <div className='info'>
        <span className='displayname'>{ username }</span>
        <span className='username'>@{ username }</span>
      </div>
      <div className='action'>
      {JSON.parse(localStorage.getItem("user")).email !== email ? (
        <button onClick={handleFollowToggle}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      ) : (
        <a href='/logout'><img src={logout_icon} alt=''></img></a>
      )}
      </div>
    </div>
  );
}

export default User;
