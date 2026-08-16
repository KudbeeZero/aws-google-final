import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Catch and gracefully handle unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Handled Promise Rejection:', event.reason);
  // Prevent browser default uncaught error reporting to avoid disruptive crash banners
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('Handled Window Error:', event.error || event.message);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
