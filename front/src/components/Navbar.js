import React, { useState } from 'react'
import PostTweetForm from './PostTweetForm';
import '../styles/Navbar.css';
import NavbarLink from './NavbarLink';
import User from './User';

import home_icon from '../icons/home_icon.svg';
import search_icon from '../icons/search_icon.svg';
import twitter_icon from '../icons/twitter_icon.svg';
import profile_icon from '../icons/profile_icon.svg';
import bookmark_icon from '../icons/bookmark_icon.svg';
import notifications_icon from '../icons/notifications_icon.svg';

const Navbar = () => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const openPostModal = () => setIsPostModalOpen(true);

  return (
    <div className='navbar'>
      <a href='/'>
        <img src={twitter_icon} alt='twitter-logo' className='twitter-logo'></img>
      </a>
      <NavbarLink name='Home' icon={home_icon} href='/' />
      <NavbarLink name='Search' icon={search_icon} href='/' />
      <NavbarLink name='Notifications' icon={notifications_icon} href='/notifications' />
      <NavbarLink name='Bookmarks' icon={bookmark_icon} href='/bookmarks' />
      <NavbarLink name='Profile' icon={profile_icon} href='/' />
      <button onClick={openPostModal}>Post</button>
      <PostTweetForm 
        isOpen={isPostModalOpen}
        setIsOpen={setIsPostModalOpen} />
      <User displayname='Display name' username='username'/>
    </div>
  );
}

export default Navbar;
