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
              viewBox="0 0 24 24"
              className="tweet__footerIcon"
            >
              <g>
                <path d="M20 12v-2h-3c-.55 0-1-1.79-1-4 0-2.21-.45-4-1-4h-1v2h1c.55 0 1 1.79 1 4 0 2.21.45 4 1 4h-3v2l-5-3 5-3v2h3c.55 0 1 1.79 1 4 0 2.21.45 4 1 4h1v2h-1c-.55 0-1-1.79-1-4 0-2.21-.45-4-1-4h3z"></path>
                </g>
            </svg>
            <span>{num_retweets}</span>
            </span>
            <span onClick={handleLike}>
            <svg
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
              viewBox="0 0 24 24"
              className="tweet__footerIcon"
            >
                <g>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
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