import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Admin from './components/Admin.jsx';
import './index.css';

function isAdminRoute() {
  if (typeof window === 'undefined') return false;
  return /^\/admin\/?/.test(window.location.pathname);
}

const Root = isAdminRoute() ? Admin : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
