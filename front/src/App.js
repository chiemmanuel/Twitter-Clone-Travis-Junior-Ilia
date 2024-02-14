import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BasePage from './pages/BasePage';
import socket from './socket';
import { useEffect, useState } from 'react';
import useAppStateContext from './hooks/useAppStateContext';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';

function App() {
  const { dispatch } = useAppStateContext();

  useEffect(() => {
    function onConnect() {
      socket.emit('userLogin', JSON.parse(localStorage.getItem('user')).email);
      dispatch({ type: 'Connect' });
    }

    function onDisconnect() {
      dispatch({ type: 'Disconnect' });
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
      <Routes>
        <Route path='/Home' element={<HomePage />} />
        <Route path='/' element={<BasePage />} />
      </Routes>
    </>
  );
}

export default App;
