import React from 'react'

const NavbarLink = ({ name, icon, href }) => {
  return (
    <div className='navbar-btn-container'>
      <a href={ href }>
        <div className='navbar-btn'>
          <img src={icon} alt='icon'></img>
          { name }
        </div>
      </a>
    </div>
  );
}

export default NavbarLink;
