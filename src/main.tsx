import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Регистрация PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Регистрируем PWA Service Worker для кэширования
      const pwaRegistration = await navigator.serviceWorker.register('/pwa-sw.js', { scope: '/' });
      console.log('[PWA] Service Worker зарегистрирован:', pwaRegistration.scope);
      
      // Регистрируем Firebase Messaging Service Worker
      const fbRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      console.log('[FCM] Firebase Messaging SW зарегистрирован:', fbRegistration.scope);
    } catch (error) {
      console.error('[PWA] Ошибка регистрации Service Worker:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
