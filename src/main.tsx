// Ensure window.fetch has both getter and setter for test executors and extensions
try {
  let _fetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : window.fetch;
  Object.defineProperty(window, 'fetch', {
    get: () => _fetch,
    set: (fn) => {
      _fetch = fn;
    },
    configurable: true,
    enumerable: true
  });
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
