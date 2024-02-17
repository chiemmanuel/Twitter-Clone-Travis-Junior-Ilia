import React, { useEffect } from 'react'
import Navbar from '../components/Navbar';
import useAppStateContext from '../hooks/useAppStateContext';
import socket from '../socket';
import Tweet from '../components/Tweet';
import { useState } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';

import '../styles/Home.css';
const HomePage = () => {
  const { dispatch } = useAppStateContext();

  const [tweets, setTweets] = useState([]);

  const handleTweetUpdate = (tweet) => {
    console.log('handleTweetUpdate for tweet_id', tweet._id, 'with tweet:', tweet);
    setTweets(prevTweets => prevTweets.map(t => t._id === tweet._id ? tweet : t));
  };

  function test_login() {
    axios.post(requests.login, {
      email: "user4@gmail.com",
      password: "password",
    }).then((response) => {
      const { token } = response.data;
      dispatch({
        type: "Login",
        payload: {
          token: token,
          email: "user4@gmail.com",
          username: "user4",
          bookmarked_tweets: [],
          _id: "65ccbd673854547c5ae94d06"
        },
        });
      }).catch((error) => {
        console.log('error', error);
      });
    socket.connect();
    }

    useEffect(() => {
      const handleNewTweet = (data) => {
        const { tweet } = data;
        console.log('Socket Tweet', tweet);
        if (!tweets.some(t => t._id === tweet._id)) {
          setTweets(prevTweets => [tweet, ...prevTweets]);
        }
      };

      const handleSocketUpdate = (data) => {
        console.log('Socket Tweet Update', data);
        const { tweet } = data;
        setTweets(prevTweets => prevTweets.map(t => t._id === tweet._id ? tweet : t));
      };


      console.log('useEffect');
      console.log('tweets', tweets);
      socket.on('tweet-created', handleNewTweet);
      socket.on('tweet-updated', handleSocketUpdate);
    
      // Clean up the effect by removing the listener when the component unmounts
      return () => {
        socket.off('tweet-created', handleNewTweet);
        socket.off('tweet-updated', handleSocketUpdate);
      }
    }, [tweets]);
        
  
  return (
    <div className='home'>
      <div className='header'>
        <Navbar />
      </div>
      <div className='main' style={
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }
      }>
        {tweets.length > 0 &&
        tweets.map((tweet) => (
          <Tweet key={tweet._id} tweet={tweet} onTweetUpdate={handleTweetUpdate} />
        ))}
      </div>

      <div className='main'>
        LIVE FEED
      </div>
    </div>
  );
}

export default HomePage;
