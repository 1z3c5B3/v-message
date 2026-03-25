import { useEffect, useCallback } from 'react';

export function usePWA() {
  // Регистрация Service Worker
  const registerSW = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/pwa-sw.js', {
          scope: '/',
        });
        console.log('[PWA] Service Worker зарегистрирован:', registration.scope);
        
        // Обновление Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Доступно обновление');
              // Можно показать пользователю кнопку "Обновить"
            }
          });
        });
        
        return registration;
      } catch (error) {
        console.error('[PWA] Ошибка регистрации SW:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Отправка сообщения в Service Worker
  const sendMessageToSW = useCallback((message: any) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }, []);

  // Слушание сообщений от Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('[PWA] Сообщение от SW:', event.data);
      
      if (event.data?.type === 'call') {
        // Обработка входящего звонка
        console.log('[PWA] Входящий звонок:', event.data.callId);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Установка PWA
  const installPWA = useCallback(() => {
    return new Promise((resolve, reject) => {
      const promptInstall = () => {
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          const promptEvent = e as any;
          promptEvent.prompt();
          promptEvent.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('[PWA] Пользователь установил приложение');
              resolve(true);
            } else {
              resolve(false);
            }
          });
        });
      };

      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] Уже установлено');
        resolve(false);
      } else {
        promptInstall();
      }
    });
  }, []);

  return {
    registerSW,
    sendMessageToSW,
    installPWA,
  };
}
