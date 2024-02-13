import React, { useEffect } from 'react'
import '../styles/Home.css';
import Navbar from '../components/Navbar';
import useAppStateContext from '../hooks/useAppStateContext';
import socket from '../socket';
import Tweet from '../components/Tweet';
import { useState } from 'react';

const HomePage = () => {
  const { dispatch } = useAppStateContext();

  const [tweets, setTweets] = useState([]);

  function test_login() {
    dispatch({
      type: "Login",
      payload: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY1Yzc2MDhjMWJlNDdkZWI5MDMxZjAzYyIsInVzZXJuYW1lIjoidXNlcjMiLCJlbWFpbCI6InVzZXIzQGdtYWlsLmNvbSJ9LCJpYXQiOjE3MDc4NjM3MzYsImV4cCI6MTcwNzg2NzMzNn0.uhEZ-pkO6GoUXGw2E4qBk7geQAlRHHL1C-5DOxiJnZs",
        email: "user3@gmail.com",
        username: "user3",
        bookmarked_tweets: [],
      },
    });
    socket.connect();
    }

    socket.on('tweet-created', data => {
        console.log('tweet-created', data);
        setTweets(prevTweets => [data, ...prevTweets]);
    });
        
  
  return (
    <div className='home'>
      <div className='header'>
        <Navbar />
      </div>
      <div className='main'>
        <button onClick={test_login}>Test Login</button>
        {tweets.map(tweet => (
            <Tweet tweet_object={tweet} />
        ))}
      </div>

      <div className='main'>
        LIVE FEED
      </div>
    </div>
  );
}

export default HomePage;
