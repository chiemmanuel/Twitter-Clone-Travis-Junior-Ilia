import { useEffect } from 'react'
import { useState } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchBookmarks,
  selectBookmarkedTweets,
  selectBookmarksStatus,
  selectBookmarksError,
} from '../features/Bookmarks/bookmarkSlice';
import Tweet from '../components/Tweet';
import Navbar from '../components/Navbar';

import '../styles/BookmarkPage.css';

function BookmarksPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const bookmarkedTweets = useSelector(selectBookmarkedTweets);
    const bookmarkStatus = useSelector(selectBookmarksStatus);
    const bookmarkError = useSelector(selectBookmarksError);

    useEffect(() => {
        if (bookmarkStatus === 'idle') {
            dispatch(fetchBookmarks());
        }
    }, [bookmarkStatus, dispatch]);

    useEffect(() => {
        if (bookmarkError !== null) {
            console.log('bookmarkError', bookmarkError);
        }
    }, [bookmarkError]);

  return (
    <div className='page'>
      <div className='header'>
          <Navbar />
      </div>
      <div className='main'>
        <div className="bookmarks">
          <h1>Bookmarks</h1>
          {bookmarkStatus === 'loading' && <div>Loading...</div>}
          {bookmarkStatus === 'succeeded' && bookmarkedTweets.map((tweet) => (
            <Tweet key={tweet._id} tweet={tweet} />
            ))}
        </div>
    </div>
    </div>
  )
}

export default BookmarksPage