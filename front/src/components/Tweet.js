import React, { useEffect } from 'react'
import { useState } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchBookmarks,
  addBookmark,
  removeBookmark,
  selectBookmarks,
  selectBookmarksStatus,
  selectBookmarksError,
} from '../features/Bookmarks/bookmarkSlice';
import socket from '../socket';
import '../styles/Tweet.css';

import Poll from './Poll';
import PostTweetForm from './PostTweetForm';
import comment_icon from '../icons/comment_icon.svg';
import like_icon from '../icons/like_icon.svg';
import bookmark_icon from '../icons/bookmark_icon.svg';
import retweet_icon from '../icons/retweet_icon.svg';


function Tweet( props ) {
    const { tweet } = props
    const { onTweetUpdate } = props;
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isRetweetModalOpen, setIsRetweetModalOpen] = useState(false);
    const openRetweetModal = () => setIsRetweetModalOpen(true);
    const bookmarkStatus = useSelector(selectBookmarksStatus);
    const bookmarks = useSelector(selectBookmarks);

    const { author_id, author_email, author_username, author_profile_img, content, media, hashtags, created_at, updated_at, poll, retweet } = tweet;
    const [num_likes, setNumLikes] = useState(tweet.num_likes);
    const [num_views, setNumViews] = useState(tweet.num_views);
    const [num_comments, setNumComments] = useState(tweet.num_comments);
    const [isLiked, setIsLiked] = useState(false);
    const [num_bookmarks, setNumBookmarks] = useState(tweet.num_bookmarks);
    const [numRetweets, setNumRetweets] = useState(tweet.num_retweets);

    useEffect(() => {
      setNumViews(prevNumViews => prevNumViews + 1);
      axios.put(requests.incrementViews + tweet._id, {
          amount: 1
      }, {
          headers: {
              Authorization: `Bearer ${user.token}`,
          },
      }).then(res => console.log(res))
      .catch(err => console.log(err));
    }, []);

    useEffect(() => {
        if (bookmarkStatus === 'idle') {
            dispatch(fetchBookmarks());
        }
    }, [bookmarkStatus, dispatch]);

      useEffect(() => {
      socket.on("update-likes", data => {
        const { tweet_id, user_id, dislike } = data;
        if (tweet_id === tweet._id && dislike) {
            setNumLikes(prevNumLikes => prevNumLikes - 1);
        } else if (tweet_id === tweet._id && !dislike) {
            setNumLikes(prevNumLikes => prevNumLikes + 1);
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

      socket.on("update-views", data => {
        if (data.tweet_id === tweet._id && data.views > num_views) {
          setNumViews(data.views);
        }
      });
      return () => {
        socket.off("update-likes");
        socket.off("retweeted");
        socket.off("bookmark");
        socket.off("increment-comment-count");
        socket.off("update-views");
      };
    }, [tweet._id, user]);
      

    const handleLike = () => {
        if (isLiked) {
            setIsLiked(false);
            //setNumLikes(num_likes - 1);
        } else {
            setIsLiked(true);
            //setNumLikes(num_likes + 1);
        }
        axios.put(requests.likeTweet + tweet._id, {}, {
          headers: {
              Authorization: `Bearer ${user.token}`,
          },
      }).then(res => console.log(res))
      .catch(err => console.log(err));
    };

    const handleBookmark = () => {
        const isBookmarked = bookmarks.includes(tweet._id);
        if (isBookmarked) {
            dispatch(removeBookmark(tweet._id));
            setNumBookmarks(num_bookmarks - 1);
            axios.post(requests.deleteBookmark + tweet._id, {}, {
                headers: {
                    Authorization: `Bearer ${
                      user.token
                    }`,
                  },
            }).then(
              res => {
              console.log(res);
              })
            .catch(err => console.log(err));
        } else {
            dispatch(addBookmark(tweet));
            setNumBookmarks(num_bookmarks + 1);
            axios.post(requests.bookmarkTweet + tweet._id, {}, {
                headers: {
                    Authorization: `Bearer ${
                      user.token
                    }`,
                  },
                }).then(
                  res => {
                  console.log(res);
                  })
                .catch(err => console.log(err));
        }
    };

    const handleComment = () => {
        navigate(`/view_tweet/${tweet._id}`);
    };

    const handleRetweetOnClick = () => {
        navigate(`/view_tweet/${retweet._id}`);
    }
    
  return (
    <div className="tweet">
      <div className="tweet__header">
        {author_profile_img && (
          <img src={author_profile_img} alt="profile" />
        )}
        <div className="tweet__headerText">
        <div className='tweet__author' onClick={()=>navigate(`/profile/${author_username}`)}>
          {author_username && (
            <h3>{author_username} </h3>
            )}
            </div>
          <p>{new Date(created_at).toUTCString()}</p>
        </div>
      </div>
      <div className="tweet__body">
        <p>{content}</p>
        { media ? (<img src={media} alt=''/>) : null}
        {/* if poll exists, render poll component with poll object */}
        {poll && poll.title && <Poll poll_object={poll} poll_id={tweet._id} />}
        {retweet && (
          <div className="tweet__retweet" onClick={handleRetweetOnClick}>
            <div className="tweet__header">
              {retweet && retweet.author_profile_img && (
                <img src={retweet.author_profile_img} alt="profile" />
              )}
              <div className="tweet__headerText">
                {retweet && retweet.author_username && (
                  <h3>{retweet.author_username}</h3>
                )}
                {new Date(created_at).toUTCString() !== new Date(updated_at).toUTCString() ? (
                  <p>Edited: {new Date(updated_at).toUTCString()}</p>
                ) : (
                  <p>{new Date(created_at).toUTCString()}</p>
                )}
              </div>
            </div>
            <div className="tweet__body">
              <p>{retweet.content}</p>
              {retweet.media ? (<img src={retweet.media} alt="media" />) : null}
              {retweet.poll && retweet.poll.title && <Poll poll_object={retweet.poll} />}
            </div>
          </div>
        )}
      </div>
      <div className="tweet__footer">
        <p className="tweet__footerViews">{num_views} views</p>
        <div className="tweet__footerIcons">
      <span onClick={handleComment}>
        <img src={comment_icon} alt="comment" className='tweet__footerIcon' title='Reply'/>
        <span>{num_comments}</span>
      </span>
          <span onClick={openRetweetModal}>
            <img src={retweet_icon} alt="retweet" className='tweet__footerIcon' title='Retweet'/>
            <span>{numRetweets}</span>
            </span>
            <PostTweetForm 
            retweet={tweet}
            isOpen={isRetweetModalOpen}
            setIsOpen={setIsRetweetModalOpen} />
            <span onClick={handleLike}>
            <img src={like_icon} alt="like" className='tweet__footerIcon'/>
            <span>{num_likes}</span>
            </span>
            <span onClick={handleBookmark}>
              <img src={bookmark_icon} alt="bookmark" className='tweet__footerIcon bookmark-icon' title='Bookmark'/>
            <span>{num_bookmarks}</span>
            </span>
        </div>
        </div>
        <div className="tweet__footer">
        {hashtags?.map((hashtag, index) => (
          <span key={index} className="tweet__footerHashtag">{'#' + hashtag}</span>
        ))}
        </div>
    </div>
  )
}

export default Tweet