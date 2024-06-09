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
  const { _id, username, profile_img } = user;
  const following = current_user.following;

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (following && following.includes(_id)) {
      setIsFollowing(true);
    }
  }, [following, _id]);

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (isFollowing) {
      await instance.delete('http://localhost:8080/followers/unfollow/' + _id,
        {
          headers: {
            Authorization: `Bearer ${current_user.token}`,
          },
        }
      ).then((res) => {
        console.log(res.data);
        dispatch({ type: 'Unfollow', payload: _id });
      }).catch((err) => {
        console.log(err);
      });
      setIsFollowing(false);
    } else {
      await instance.post('http://localhost:8080/followers/follow/' + _id, {},
        {
          headers: {
            Authorization: `Bearer ${current_user.token}`,
          },
        }
      ).then((res) => {
        console.log(res.data);
        dispatch({ type: 'Follow', payload: _id });
      }).catch((err) => {
        console.log(err);
      });
      setIsFollowing(true);
    }
  };

  return (
    <div className='user' onClick={_id === current_user._id ? (() => navigate(`/profile`)) : (() => navigate(`/profile/${username}`))}>
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
        <a href='/logout'><img src={logout_icon} alt=''></img></a>
      )}
      </div>
    </div>
  );
}

export default User;
