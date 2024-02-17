import React, { useEffect } from 'react'
import '../styles/Home.css';
import Navbar from '../components/Navbar';

const HomePage = () => {
  return (
    <div className='home'>
      <div className='header'>
        <Navbar />
      </div>

      <div className='main'>
        <div className='livefeed'>

        </div>

        <div className=''>

        </div>
      </div>
    </div>
  );
}

export default HomePage;
