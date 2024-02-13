import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import socket from './socket';
import { useEffect, useState } from 'react';
import useAppStateContext from './hooks/useAppStateContext';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';
import { AppStateProvider } from './context/AppStateProvider';

function App() {
  const { dispatch } = useAppStateContext();
  console.log('useAppStateContext', useAppStateContext());
  console.log('dispatch', dispatch);



  useEffect(() => {
    function onConnect() {
      socket.emit('userLogin', JSON.parse(localStorage.getItem('user')).email);
      // dispatch({ type: 'Connect' });
    }

    function onDisconnect() {
      // dispatch({ type: 'Disconnect' });
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
        <Route path='/' element={<HomePage />} />
        <Route path='/test' element={<TestPage />} />
      </Routes>
    </AppStateProvider>
    </>
  );
}

export default App;
