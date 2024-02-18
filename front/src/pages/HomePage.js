import React, { useState, useEffect} from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import instance from '../constants/axios'
import { requests } from '../constants/requests'
import socket from '../socket'
import Tweet from '../components/Tweet'
import '../styles/Home.css';
import Navbar from '../components/Navbar';

const HomePage = () => {

  const [liveFeedTweets, setLiveFeedTweets] = useState([]);
  const [liveFeedHasMore, setLiveFeedHasMore] = useState(true);
  const [liveFeedLastId, setLiveFeedLastId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.on('new-tweet', data => {
      setLiveFeedTweets(prevTweets => [data, ...prevTweets]);
    });
    
    instance.get(requests.liveFeed, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }).then((res) => {
      console.log(res.data);
      setLiveFeedTweets(res.data.tweets);
      setLiveFeedLastId(res.data.last_tweet_id);
      if (res.data.tweets.length < 10) {
        setLiveFeedHasMore(false);
      }
    }).catch((err) => {
      console.log(err);
    });
    return () => {
      socket.off('new-tweet');
    }
  }, []);

  const fetchMoreLiveFeedTweets = () => {
    instance.get(requests.liveFeed + `?last_tweet_id=${liveFeedLastId}`,
      {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }).then((res) => {
      setLiveFeedTweets(prevTweets => [...prevTweets, ...res.data.tweets]);
      setLiveFeedLastId(res.data.last_tweet_id);
      if (res.data.tweets.length < 10 || res.data.last_tweet_id === null) {
        setLiveFeedHasMore(false);
      }
    }).catch((err) => {
      console.log(err);
    });
  }

  return (
    <div className='home'>
      <div className='header'>
        <Navbar />
      </div>

      <div className='main'>
        <div className='livefeed'>
          <InfiniteScroll
            dataLength={liveFeedTweets.length}
            next={fetchMoreLiveFeedTweets}
            hasMore={liveFeedHasMore}
            loader={<h4>Loading...</h4>}
          >
            {liveFeedTweets.map((tweet) => {
              return <Tweet key={tweet._id} tweet={tweet} />
            })}
          </InfiniteScroll>

        </div>

        <div className=''>

        </div>
      </div>
    </div>
  );
}

export default HomePage;
