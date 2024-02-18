import { Route, Routes } from 'react-router-dom';
import socket from './socket';
import { useEffect } from 'react';
import useAppStateContext from './hooks/useAppStateContext.js';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';

import HomePage from './pages/HomePage';
import BasePage from './pages/BasePage';
import TestPage from './pages/TestPage';
import ProfilePage from './pages/ProfilePage';
import Userprofile from './pages/Userprofile';
import ViewTweetPage from './pages/TweetPage.js';
import NotificationPage from './pages/NotificationPage.js';
import BookmarkPage from './pages/BookmarksPage.js';
import SearchPage from './pages/SearchPage.js';

import { useDispatch } from 'react-redux';
import { addNotification } from './features/Notifications/notificationSlice.js';
import { addBookmark, removeBookmark } from './features/Bookmarks/bookmarkSlice.js';

function App() {
  const { dispatch } = useAppStateContext();
  const reduxDisbatch = useDispatch();

  useEffect(() => {
    function onConnect() {
      if (localStorage.getItem('user') !== null) {
        socket.emit('userLogin', JSON.parse(localStorage.getItem('user')).email);
      } else {
        console.log('no user');
      }
    }

    function onDisconnect() {
      console.log('socket disconnected');
    }

    function onNotification(data) {
      if (localStorage.getItem('user') !== null) {
      console.log('notification received:', data);
      reduxDisbatch(addNotification(data));
      } else {
        console.log('no user');
      }
    }

    function onBookmark(data) {
      if (localStorage.getItem('user') !== null) {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('bookmark received:', data);
        const { tweet_id, user_id, remove } = data;
        if (user._id === user_id) {
          if (remove) {
            reduxDisbatch(removeBookmark(tweet_id));
          } else {
            reduxDisbatch(addBookmark(tweet_id));
          }
        }
    } else {
      console.log('no user');
    }
    }

    function onProfileImageUpdate(data) {
      if (localStorage.getItem('user') !== null) {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('profile image update received:', data);
        const { profile_img, _id } = data;
        if (user._id === _id) {
          dispatch({ type: 'UpdateProfileImage', payload: profile_img });
        }
      } else {
        console.log('no user');
      }
    }

    function onUsernameUpdate(data) {
      if (localStorage.getItem('user') !== null) {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('username update received:', data);
        const { new_username, _id } = data;
        if (user._id === _id) {
          dispatch({ type: 'UpdateUsername', payload: new_username });
        }
      } else {
        console.log('no user');
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotification);
    socket.on('bookmark', onBookmark);
    socket.on('update-profile-image', onProfileImageUpdate);
    socket.on('update-username', onUsernameUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', onNotification);
      socket.off('bookmark', onBookmark);
      socket.off('update-profile-image', onProfileImageUpdate);
      socket.off('update-username', onUsernameUpdate);
    };
  }, []);


  return (
    <>
      <Routes>
        <Route path='/' element={<BasePage />} />
        <Route path='/Home' element={<HomePage />} />
        <Route path='/profile/' element={<ProfilePage />} />
        <Route path='/profile/:username' element={<Userprofile />} />
        <Route element={<PublicRoute />}>
          <Route path='/test' element={<TestPage />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route path='/view_tweet/:id' element={<ViewTweetPage />} />
          <Route path='/notifications' element={<NotificationPage />} />
          <Route path='/bookmarks' element={<BookmarkPage />} />
          <Route path='/search' element={<SearchPage />} />
        </Route>
          
      </Routes>
    </>
  );
}

export default App;
