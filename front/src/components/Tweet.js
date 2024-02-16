import React, { useEffect } from 'react'
import { useState } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import '../styles/Tweet.css';

import Poll from './Poll';
import PostTweetForm from './PostTweetForm';
import comment_icon from '../icons/comment_icon.svg';
import like_icon from '../icons/like_icon.svg';

function Tweet( props ) {
    const { tweet } = props
    const { onTweetUpdate } = props;
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const [isRetweetModalOpen, setIsRetweetModalOpen] = useState(false);
    const openRetweetModal = () => setIsRetweetModalOpen(true);

    const { author, content, media, hashtags, num_views, created_at, updated_at, poll, retweet, retweet_author } = tweet;
    
    const [num_comments, setNumComments] = useState(tweet.num_comments);
    const [liked_by, setLikedBy] = useState(tweet.liked_by);
    const [isLiked, setIsLiked] = useState(liked_by.includes(user._id));
    const [num_bookmarks, setNumBookmarks] = useState(tweet.num_bookmarks);
    const [isBookmarked, setIsBookmarked] = useState(user.bookmarked_tweets.includes(tweet._id));
    const [numRetweets, setNumRetweets] = useState(tweet.num_retweets);

      useEffect(() => {
        if ( onTweetUpdate !== undefined ) {
          var updated_tweet = tweet;
          updated_tweet.num_comments = num_comments;
          updated_tweet.liked_by = liked_by;
          updated_tweet.num_bookmarks = num_bookmarks;
          updated_tweet.num_retweets = numRetweets;
          console.log('calling onTweetUpdate')
          onTweetUpdate(updated_tweet);
        }

      }, [num_comments, liked_by, num_bookmarks, numRetweets, tweet]);

      useEffect(() => {
      socket.on("update-likes", data => {
        const { tweet_id, user_id, dislike } = data;
        if (user_id === user._id) {
          console.log('skipped', user_id, user._id);
          return;
        }
        console.log('not skipped', user_id, user._id);
        if (tweet_id === tweet._id && dislike) {
          setLikedBy( prevLikedBy => prevLikedBy.filter(id => id !== user_id));
        } else if (tweet_id === tweet._id && !dislike) {
            setLikedBy( prevLikedBy => [...prevLikedBy, user_id]);
        }
      });
      socket.on("retweeted", data => {
        console.log('retweet', data);
        console.log('tweet', tweet._id);
        if (data.tweet_id === tweet._id) {
          setNumRetweets(prevNumRetweets => prevNumRetweets + 1);
          console.log('added retweet for id:', tweet._id);
        }
      });
      socket.on("bookmark", data => {
          if (data._id === tweet._id && user._id !== data.user_id) {
              let value = data.deleted ? -1 : 1;
              setNumBookmarks(prevNumBookmarks => prevNumBookmarks + value);
          }
      });
      socket.on("increment-comment-count", data => {
        const tweetId = data.tweetId;
          if (tweetId === tweet._id) {
              setNumComments(prevNumComments => prevNumComments + 1);
          }
      });
      return () => {
        socket.off("update-likes");
        socket.off("retweeted");
        socket.off("bookmark");
        socket.off("increment-comment-count");
      };
    }, [tweet._id, user]);
      

    const handleLike = () => {
        if (isLiked) {
            setLikedBy(liked_by.filter(id => id !== user._id));
            setIsLiked(false);
        } else {
            setLikedBy([...liked_by, user._id]);
            setIsLiked(true);
        }
        axios.put(requests.likeTweet + tweet._id, {}, {
          headers: {
              Authorization: `Bearer ${user.token}`,
          },
      }).then(res => console.log(res))
      .catch(err => console.log(err));
    };

    const handleBookmark = () => {
        if (isBookmarked) {
            setNumBookmarks(num_bookmarks - 1);
            setIsBookmarked(false);

            // dispatch delete bookmark action
            axios.post(requests.deleteBookmark + tweet._id, {}, {
                headers: {
                    Authorization: `Bearer ${
                      user.token
                    }`,
                  },
            }).then(res => console.log(res))
            .catch(err => console.log(err));
        } else {
            setNumBookmarks(num_bookmarks + 1);
            setIsBookmarked(true);
            // dispatch add bookmark action
            axios.post(requests.bookmarkTweet + tweet._id, {}, {
                headers: {
                    Authorization: `Bearer ${
                      user.token
                    }`,
                  },
            }).then(res => console.log(res))
            .catch(err => console.log(err));
        }
    };

    const handleComment = () => {
        navigate(`/view_tweet/${tweet._id}`);
    };

    const handleRetweetOnClick = () => {
        navigate(`/view_tweet/?id=${retweet._id}`);
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
        { media !== "" && media !== null && <img src={media} alt="media" />}
        {/* if poll exists, render poll component with poll object */}
        {poll && <Poll poll_object={poll} />}
        {retweet && (
          <div className="tweet__retweet" onClick={handleRetweetOnClick}>
            <div className="tweet__header">
              <img src={retweet_author.profile_img} alt="profile" />
              <div className="tweet__headerText">
                <h3>
                  {retweet_author.username}{" "}
                </h3>
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
              {retweet.poll && <Poll poll={retweet.poll} />}
            </div>
          </div> 
        )}
      </div>
      <div className="tweet__footer">
        <p className="tweet__footerViews">{num_views} views</p>
        <div className="tweet__footerIcons">
          <span onClick={handleComment}>
            <img src={comment_icon} alt="comment" className='tweet__footerIcon'/>
            <span>{num_comments}</span>
          </span>
          <span onClick={openRetweetModal}>
            <PostTweetForm 
            retweet={tweet}
            isOpen={isRetweetModalOpen}
            setIsOpen={setIsRetweetModalOpen} />
            <svg
              className='tweet__footerIcon'
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="#000"
              stroke-linecap="square"
              fill="none" color="#000">
              <path d="M13 18H6V7"/>
              <path d="m3 9 3-3 3 3m2-3h7v11"/>
              <path d="m21 15-3 3-3-3"/>
            </svg>
            <span>{numRetweets}</span>
            </span>
            <span onClick={handleLike}>
            <img src={like_icon} alt="like" className='tweet__footerIcon'/>
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
        {hashtags.map((hashtag, index) => (
          <span key={index} className="tweet__footerHashtag">{'#' + hashtag}</span>
        ))}
        </div>
    </div>
  )
}

export default Tweet