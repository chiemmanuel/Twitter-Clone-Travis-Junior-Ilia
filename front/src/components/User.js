import { useEffect, useState } from 'react';
import '../styles/User.css';
import socket from '../socket';


import logout_icon from '../icons/logout_icon.svg';

const User = ({ user }) => {
  const { username, profile_img } = user;

  return (
    <div className='user'>
      <div className='user-photo' style={{ backgroundImage: `url(${profile_img})` }}></div>
      <div className='info'>
        <span className='displayname'>{ username }</span>
        <span className='username'>@{ username }</span>
      </div>
      <div className='action'>
        <a href='/'>
          <img src={logout_icon} alt=''></img>
        </a>
      </div>
    </div>
  );
}

export default User;
