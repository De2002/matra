// Ensure global fetch is safely configurable with a setter on window, Window.prototype, and globalThis
try {
  if (typeof window !== 'undefined') {
    const rawFetch = window.fetch ? window.fetch.bind(window) : null;
    let currFetch = rawFetch;
    const fetchDesc = {
      get: () => currFetch,
      set: (fn: typeof fetch) => {
        currFetch = fn;
      },
      configurable: true,
      enumerable: true,
    };
    try { Object.defineProperty(window, 'fetch', fetchDesc); } catch (_) {}
    if (typeof Window !== 'undefined' && Window.prototype) {
      try { Object.defineProperty(Window.prototype, 'fetch', fetchDesc); } catch (_) {}
    }
    if (typeof globalThis !== 'undefined' && globalThis !== window) {
      try { Object.defineProperty(globalThis, 'fetch', fetchDesc); } catch (_) {}
    }
  }
} catch (_) {}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
