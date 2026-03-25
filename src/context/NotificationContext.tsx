import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { initOneSignal, requestNotificationPermission, getSubscriptionState } from '@/lib/onesignal';

interface NotificationContextType {
  notificationPermission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<void>;
  revokePermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Инициализация OneSignal при загрузке
  useEffect(() => {
    const init = async () => {
      await initOneSignal();
      setInitialized(true);

      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      // Проверка состояния подписки
      const state = await getSubscriptionState();
      setIsSubscribed(state.subscribed || false);
    };
    init();
  }, []);

  // Обновление состояния при изменении user
  useEffect(() => {
    if (!initialized || !user) return;
    
    const checkSubscription = async () => {
      const state = await getSubscriptionState();
      setIsSubscribed(state.subscribed || false);
    };
    checkSubscription();
  }, [user, initialized]);

  // Запрос разрешения на уведомления
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает push-уведомления');
      return;
    }

    try {
      // Сначала запросим разрешение браузера
      const browserPermission = await Notification.requestPermission();
      setNotificationPermission(browserPermission as NotificationPermission);

      if (browserPermission === 'granted') {
        // Затем инициализируем OneSignal
        const permission = await requestNotificationPermission();
        console.log('OneSignal permission:', permission);
        
        const state = await getSubscriptionState();
        setIsSubscribed(state.subscribed || false);
        
        if (state.subscribed) {
          console.log('✅ Push-уведомления успешно включены');
        } else {
          console.log('⚠️ Браузер разрешил, но OneSignal не подключился');
        }
      }
    } catch (error) {
      console.error('Ошибка при включении уведомлений:', error);
      alert('Не удалось включить уведомления: ' + (error as Error).message);
    }
  }, []);

  // Отписка от уведомлений
  const revokePermission = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).OneSignal) {
        await (window as any).OneSignal.User.PushSubscription.optOut();
      }
      // Закроем браузерное разрешение (не всегда работает)
      if ('Notification' in window && Notification.permission === 'granted') {
        // Некоторые браузеры позволяют отозвать через navigator.permissions
        console.log('Уведомления отключены');
      }
      
      const state = await getSubscriptionState();
      setIsSubscribed(state.subscribed || false);
    } catch (error) {
      console.error('Ошибка при отключении уведомлений:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notificationPermission, isSubscribed, requestPermission, revokePermission }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}
