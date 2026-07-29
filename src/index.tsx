import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import MyApp from './containers/App';
import { store } from './redux/store';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
      <BrowserRouter>
        <MyApp />
      </BrowserRouter>
    </Provider>
);
