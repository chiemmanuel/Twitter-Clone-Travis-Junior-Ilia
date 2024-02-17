import { Route, Routes } from 'react-router-dom';
import socket from './socket';
import { useEffect } from 'react';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';
import { AppStateProvider } from './context/AppStateProvider';

import HomePage from './pages/HomePage';
import BasePage from './pages/BasePage';
import TestPage from './pages/TestPage';
import ViewTweetPage from './pages/TweetPage.js';

function App() {

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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <>
    <AppStateProvider>
      <Routes>
        <Route path='/' element={<BasePage />} />
        <Route path='/home' element={<HomePage />} />
        <Route element={<PublicRoute />}>
          <Route path='/test' element={<TestPage />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route path='/view_tweet/:id' element={<ViewTweetPage />} />
        </Route>
          
      </Routes>
    </AppStateProvider>
    </>
  );
}

export default App;
