
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// @ts-ignore
import { Keystatic } from 'https://esm.sh/@keystatic/core@0.5.48/ui';
import keystaticConfig from './keystatic.config';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

/**
 * Check if the current URL is the Keystatic admin interface.
 * We check if the path ends with /keystatic or /keystatic/ to support 
 * both root domains and GitHub Pages sub-directories.
 */
const isKeystatic = window.location.pathname.endsWith('/keystatic') || 
                    window.location.pathname.endsWith('/keystatic/') ||
                    window.location.pathname.includes('/keystatic/');

const root = ReactDOM.createRoot(rootElement);

if (isKeystatic) {
  // Render Keystatic Admin UI if path matches
  root.render(
    <React.StrictMode>
      <Keystatic config={keystaticConfig} />
    </React.StrictMode>
  );
} else {
  // Render Main App
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
