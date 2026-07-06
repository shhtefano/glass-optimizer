import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Handle Service Worker registration for offline PWA capabilities
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Unregister service workers in development to prevent caching issues and allow Vite HMR to work
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Unregistered active service worker for development');
            window.location.reload();
          }
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA Service Worker registered with scope: ', registration.scope);
        })
        .catch((err) => {
          console.error('PWA Service Worker registration failed: ', err);
        });
    });
  }
}
