import React from 'react';
import { Provider } from 'react-redux';
import store from './store/store';
import { AppStateProvider } from './context/AppStateProvider';
import App from './App';

function Root() {
  return (
    <Provider store={store}>
    <AppStateProvider>
      <App />
    </AppStateProvider>
    </Provider>
  );
}

export default Root;