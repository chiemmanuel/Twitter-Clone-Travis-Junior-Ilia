import React, { useEffect } from 'react'
import { useState } from 'react';
import axios from '../constants/axios';
import requests from '../constants/requests';
import { useNavigate } from 'react-router-dom';
import socketIOClient from "socket.io-client";
import '../styles/Tweet.css';

import Poll from './Poll';



function Tweet({ tweet_object }) {
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    const { author, content, media, hashtags, num_views, created_at, updated_at, poll, retweet, retweet_author } = tweet_object;
    
    const [num_comments, setNumComments] = useState(tweet_object.num_comments);
    const [liked_by, setLikedBy] = useState(tweet_object.liked_by);
    const [isLiked, setIsLiked] = useState(liked_by.includes(user._id));
    const [num_bookmarks, setNumBookmarks] = useState(tweet_object.num_bookmarks);
    const [isBookmarked, setIsBookmarked] = useState(user.bookmarked_tweets.includes(tweet_object._id));
    const [num_retweets, setNumRetweets] = useState(tweet_object.num_retweets);

    useEffect(() => {
      const socket = socketIOClient(3000);
      socket.on("like", data => {
        if (data._id === tweet_object._id) {
          setLikedBy(data.liked_by);
        }
      });
      socket.on("retweet", data => {
        if (data._id === tweet_object._id) {
          setNumRetweets(prevNumRetweets => prevNumRetweets + 1);
        }
      });
      socket.on("bookmark", data => {
          if (data._id === tweet_object._id) {
              setNumBookmarks(prevNumBookmarks => prevNumBookmarks + 1);
          }
      });
      socket.on("comment", data => {
          if (data._id === tweet_object._id) {
              setNumComments(prevNumComments => prevNumComments + 1);
          }
      });
  
      // Cleanup on unmount
      return () => socket.disconnect();
    }, [tweet_object._id]);

    const handleLike = () => {
        if (isLiked) {
            setLikedBy(liked_by.filter(id => id !== user_id));
            setIsLiked(false);
            // dispatch unlike tweet action
        } else {
            setLikedBy([...liked_by, user._id]);
            setIsLiked(true);
            // dispatch like tweet action
        }
        axios.put(requests.likeTweet + tweet_object._id, {
            headers: {
                Authorization: `Bearer ${
                  user.token
                }`,
              },
        }).catch(err => console.log(err));
    };

    const handleBookmark = () => {
        if (isBookmarked) {
            setNumBookmarks(num_bookmarks - 1);
            setIsBookmarked(false);
            // dispatch delete bookmark action
            axios.post(requests.deleteBookmark + tweet_object._id, {
                headers: {
                    Authorization: `Bearer ${
                      user.token
                    }`,
                  },
            }).catch(err => console.log(err));
        } else {
            setNumBookmarks(num_bookmarks + 1);
            setIsBookmarked(true);
            // dispatch add bookmark action
            axios.post(requests.bookmarkTweet + tweet_object._id, {
                headers: {
                    Authorization: `Bearer ${
                      user.token
                    }`,
                  },
            }).catch(err => console.log(err));
        }
    };

    const handleComment = () => {
        navigate(`/view_tweet/${tweet_object._id}`);
    };

    const handleRetweetButton = () => {
        navigate(`/post_tweet/?retweet_id=${tweet_object._id}`);
    }

    const handleRetweetOnClick = () => {
        navigate(`/view_tweet/${retweet._id}`);
    }
    
  return (
    <div className="tweet">
      <div className="tweet__header">
        <img src={author.profile_img} alt="profile" />
        <div className="tweet__headerText">
          <h3>
            {author.username}{" "}
          </h3>
          <p>{new Date(created_at).toUTCString()}</p>
        </div>
      </div>
      <div className="tweet__body">
        <p>{content}</p>
        <img src={media} alt="media" />
        {/* if poll exists, render poll component with poll object */}
        {poll && <Poll poll={poll} />}
        {/* if retweet exists, display retweet author and body with no footer */}
        {retweet && (
          <div className="tweet__retweet" onClick={handleRetweetOnClick}>
            <div className="tweet__header">
              <img src={retweet_author.profile_img} alt="profile" />
              <div className="tweet__headerText">
                <h3>
                  {retweet_author.username}{" "}
                </h3>
                {/* if updated_at is different from created_at, display updated_at instead of created_at*/}
                {new Date(created_at).toUTCString() !== new Date(updated_at).toUTCString() ? (
                    <p>Edited: {new Date(updated_at).toUTCString()}</p>
                ) : (
                    <p>{new Date(created_at).toUTCString()}</p>
                )
                }
              </div>
            </div>
            <div className="tweet__body">
              <p>{retweet.content}</p>
              <img src={retweet.media} alt="media" />
              {/* if poll exists, render poll component with poll object */}
              {retweet.poll && <Poll poll={retweet.poll} />}
            </div>
          </div> 
        )}
      </div>
      <div className="tweet__footer">
        <p className="tweet__footerViews">{num_views} views</p>
        <div className="tweet__footerIcons">
          <span onClick={handleComment}>
            <svg
              viewBox="0 0 24 24"
              className="tweet__footerIcon"
            >
              <g>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17v-7h-4v-2h4V7l5 5-5 5z"></path>
              </g>
            </svg>
            <span>{num_comments}</span>
          </span>
          <span onClick={handleRetweetButton}>
            <svg 
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="#000000"
              stroke-width="1"
              stroke-linecap="square"
              stroke-linejoin="miter" 
              fill="none" color="#000000"
              className='tweet__footerIcon'
            > 
              <title id="retweetIconTitle">Retweet</title>
              <g>
                <path d="M13 18L6 18L6 7"/>
                <path d="M3 9L6 6L9 9"/>
                <path d="M11 6L18 6L18 17"/>
                <path d="M21 15L18 18L15 15"/>
              </g>
            </svg>
            <span>{num_retweets}</span>
            </span>
            <span onClick={handleLike}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="tweet__footerIcon"
            >
                <g>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </g>
            </svg>
            <span>{liked_by.length}</span>
            </span>
            <span onClick={handleBookmark}>
            <svg 
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 50 50"
              className='tweet__footerIcon'>
                <g>
                  <path d="M 12.8125 2 C 12.335938 2.089844 11.992188 2.511719 12 3 L 12 47 C 11.996094 47.359375 12.1875 47.691406 12.496094 47.871094 C 12.804688 48.054688 13.1875 48.054688 13.5 47.875 L 25 41.15625 L 36.5 47.875 C 36.8125 48.054688 37.195313 48.054688 37.503906 47.871094 C 37.8125 47.691406 38.003906 47.359375 38 47 L 38 3 C 38 2.449219 37.550781 2 37 2 L 13 2 C 12.96875 2 12.9375 2 12.90625 2 C 12.875 2 12.84375 2 12.8125 2 Z M 14 4 L 36 4 L 36 45.25 L 25.5 39.125 C 25.191406 38.945313 24.808594 38.945313 24.5 39.125 L 14 45.25 Z"></path>
                </g>
            </svg>
            <span>{num_bookmarks}</span>
            </span>
        </div>
        </div>
        <div className="tweet__footer">
            {hashtags.map(hashtag => (
                <span className="tweet__footerHashtag">{hashtag}</span>
            ))}
        </div>
    </div>
  )
}

export default Tweet