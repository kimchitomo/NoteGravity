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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { type: 'module' })
      .then(reg => {
        console.log('Service Worker registered with scope:', reg.scope);
        
        // Tự động kích hoạt ngay khi cài đặt xong bản mới
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch(err => console.error('Service Worker registration failed:', err));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker updated. Skipping auto-reload to prevent loops.');
    });
  });
}
