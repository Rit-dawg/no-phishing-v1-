
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import keystaticConfig from './keystatic.config';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isKeystatic = window.location.pathname.includes('/keystatic');

const root = ReactDOM.createRoot(rootElement);

async function render() {
  if (isKeystatic) {
    // Dynamically import to keep main bundle small and avoid build-time resolution errors
    // @ts-ignore
    const { Keystatic } = await import('https://esm.sh/@keystatic/core@0.5.48/ui');
    root.render(
      <React.StrictMode>
        <Keystatic config={keystaticConfig} />
      </React.StrictMode>
    );
  } else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
