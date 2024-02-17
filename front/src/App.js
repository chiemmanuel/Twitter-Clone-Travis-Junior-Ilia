import { Route, Routes } from 'react-router-dom';
import socket from './socket';
import { useEffect } from 'react';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';

import HomePage from './pages/HomePage';
import BasePage from './pages/BasePage';
import TestPage from './pages/TestPage';
import ViewTweetPage from './pages/TweetPage.js';
import NotificationPage from './pages/NotificationPage.js';

import { useDispatch } from 'react-redux';
import { addNotification } from './features/Notifications/notificationSlice.js';
import { addBookmark, removeBookmark } from './features/Bookmarks/bookmarkSlice.js';

function App() {
  
  const dispatch = useDispatch();

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
      dispatch(addNotification(data));
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
            dispatch(removeBookmark(tweet_id));
          } else {
            dispatch(addBookmark(tweet_id));
          }
        }
    } else {
      console.log('no user');
    }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification', onNotification);
    socket.on('bookmark', onBookmark);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification', onNotification);
    };
  }, []);


  return (
    <>
      <Routes>
        <Route path='/' element={<BasePage />} />
        <Route path='/home' element={<HomePage />} />
        <Route element={<PublicRoute />}>
          <Route path='/test' element={<TestPage />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route path='/view_tweet/:id' element={<ViewTweetPage />} />
          <Route path='/notifications' element={<NotificationPage />} />

        </Route>
          
      </Routes>
    </>
  );
}

export default App;
