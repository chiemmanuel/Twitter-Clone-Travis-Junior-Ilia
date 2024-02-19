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
  const [followedTweets, setFollowedTweets] = useState([]);
  const [followedHasMore, setFollowedHasMore] = useState(true);
  const [followedLastId, setFollowedLastId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const [activeSection, setActiveSection] = useState('livefeed');

  useEffect(() => {
    socket.on('tweet-created', data => {
      const tweet = data.tweet;
      if (liveFeedTweets.includes(tweet)) {
        return;
      }
      setLiveFeedTweets(prevTweets => [tweet, ...prevTweets]);
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
        console.log('no more tweets');
        setLiveFeedHasMore(false);
      }
    }).catch((err) => {
      console.log(err);
    });

    instance.get(requests.getFollowedTweets, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }).then((res) => {
      console.log(res.data);
      setFollowedTweets(res.data.tweets);
      setFollowedLastId(res.data.last_tweet_id);
      if (res.data.tweets.length < 10) {
        console.log('no more tweets');
        setFollowedHasMore(false);
      }
    }).catch((err) => {
      console.log(err);
    });
    return () => {
      socket.off('tweet-created');
      // clear the live feed and followed tweets
      setLiveFeedTweets([]);
      setFollowedTweets([]);

    }
  }, []);


  const fetchMoreFollowedTweets = () => {
    console.log('fetching more followed tweets');
    instance.get(requests.getFollowedTweets + `?last_tweet_id=${followedLastId}`, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }).then((res) => {
      setFollowedTweets(prevTweets => [...prevTweets, ...res.data.tweets]);
      setFollowedLastId(res.data.last_tweet_id);
      if (res.data.tweets.length < 10 || res.data.last_tweet_id === null) {
        console.log('no more tweets');
        setFollowedHasMore(false);
      }
    }).catch((err) => {
      console.log(err);
    });
  }

  const fetchMoreLiveFeedTweets = () => {
    console.log('fetching more live feed tweets');
    instance.get(requests.liveFeed + `?last_tweet_id=${liveFeedLastId}`,
      {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    }).then((res) => {
      setLiveFeedTweets(prevTweets => [...prevTweets, ...res.data.tweets]);
      setLiveFeedLastId(res.data.last_tweet_id);
      if (res.data.tweets.length < 10 || res.data.last_tweet_id === null) {
        console.log('no more tweets');
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
        <div className='tabs'>
          <button onClick={()=>setActiveSection('livefeed')}>Live Feed</button>
          <button onClick={()=>setActiveSection('forYou')}>For You</button>
        </div>
        {activeSection === 'livefeed' ? (
        <div className='livefeed'>
          <h1>Live Feed</h1>
          <InfiniteScroll
            dataLength={liveFeedTweets.length}
            next={fetchMoreLiveFeedTweets}
            hasMore={liveFeedHasMore}
            loader={<h4>Loading...</h4>}
            scrollableTarget="livefeed"
            scrollThreshold={0.5}
          >
            {liveFeedTweets.map((tweet) => {
              return <Tweet key={tweet._id} tweet={tweet} />
            })}
          </InfiniteScroll>
        </div>
      ) : (
        <div className='forYou'>
          <h1>For You</h1>
          <InfiniteScroll
            dataLength={followedTweets.length}
            next={fetchMoreFollowedTweets}
            hasMore={followedHasMore}
            loader={<h4>Loading...</h4>}
            scrollableTarget="forYou"
            scrollThreshold={0.5}
          >
            {followedTweets.map((tweet) => {
              return <Tweet key={tweet._id} tweet={tweet} />
            })}
          </InfiniteScroll>
        </div>
      )}
      </div>
    </div>
  );
}

export default HomePage;
