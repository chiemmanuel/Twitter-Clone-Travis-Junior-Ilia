import React from 'react';
import '../styles/User.css';

import logout_icon from '../icons/logout_icon.svg';

const User = ({  displayname, username, action }) => {
  return (
    <div className='user'>
      <div className='user-photo'>

      </div>
      <div className='info'>
        <span className='displayname'>{ displayname }</span>
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
