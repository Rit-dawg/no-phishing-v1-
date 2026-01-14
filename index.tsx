
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simplest possible entry point to avoid build-time resolution errors.
// We strictly render the App and handle the admin route as a simple conditional
// or external link to avoid bundling Keystatic's Node-heavy core.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Safely check for production environment using optional chaining on import.meta.env
const isProd = import.meta.env?.PROD ?? false;

if ('serviceWorker' in navigator && isProd) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
