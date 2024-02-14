import React, { useEffect } from 'react'
import '../styles/Home.css';
import Navbar from '../components/Navbar';
import useAppStateContext from '../hooks/useAppStateContext';
import socket from '../socket';
import Tweet from '../components/Tweet';
import { useState } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';

const HomePage = () => {
  const { dispatch } = useAppStateContext();

  const [tweets, setTweets] = useState([]);

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

  function test_post_tweet() {
    axios.post(requests.postTweet, {
        content: "this is test tweet",
        retweet_id: "65c75f47edbf6c380e41dbcd",
        media: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fclipart-library.com%2Frandom-cliparts.html&psig=AOvVaw18dmIDkbOaKJzSrJTbTvvB&ust=1707322096129000&source=images&cd=vfe&opi=89978449&ved=0CBMQjRxqFwoTCMjKgsuMl4QDFQAAAAAdAAAAABAI",
        poll:{"title": "test poll",
        duration_seconds: 60,
        options: ["1", "2"]},
        hashtags: ["first hastag", "second hashtag"]
    }, {
      headers: {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
    }
    }).then((response) => {
      console.log('response', response);
    }).catch((error) => {
      console.log('error', error);
    });
  }

    useEffect(() => {
      const handleNewTweet = (data) => {
        const { tweet } = data;
        // check if tweet with that id already exists
        // if not, add to tweets
        if (!tweets.some(t => t._id === tweet._id)) {
          setTweets(prevTweets => [tweet, ...prevTweets]);
        }
      };

      const handleTweetUpdate = (data) => {
        console.log('tweet update', data);
        const { tweet } = data;
        setTweets(prevTweets => prevTweets.map(t => t._id === tweet._id ? tweet : t));
      };


    
      socket.on('tweet-created', handleNewTweet);
      socket.on('tweet-updated', handleTweetUpdate);
    
      // Clean up the effect by removing the listener when the component unmounts
      return () => {
        socket.off('tweet-created', handleNewTweet);
        socket.off('tweet-updated', handleTweetUpdate);
      }
    }, [tweets]);
        
  
  return (
    <div className='home'>
      <div className='header'>
        <Navbar />
      </div>
      <div className='main'>
        <button onClick={test_login}>Test Login</button>
        <button onClick={test_post_tweet}>Test Post Tweet</button>
        { console.log('tweets', tweets) }
        {
        tweets.map((tweet) => (

          <Tweet key={tweet._id} tweet={tweet} />
        ))}
      </div>

      <div className='main'>
        LIVE FEED
      </div>
    </div>
  );
}

export default HomePage;
