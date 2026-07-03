import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.onerror = (message, source, lineno, colno, error) => {
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
    <h2>Runtime Error</h2>
    <p>${message}</p>
    <pre>${error?.stack}</pre>
  </div>`;
};
window.onunhandledrejection = (event) => {
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
    <h2>Unhandled Promise Rejection</h2>
    <pre>${event.reason?.stack || event.reason}</pre>
  </div>`;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
