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

  // Инициализация OneSignal при загрузке
  useEffect(() => {
    initOneSignal();
    
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Проверка состояния подписки
    const checkSubscription = async () => {
      const state = await getSubscriptionState();
      setIsSubscribed(state.subscribed || false);
    };
    checkSubscription();
  }, []);

  // Запрос разрешения на уведомления
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает push-уведомления');
      return;
    }

    const permission = await requestNotificationPermission();
    setNotificationPermission(permission as NotificationPermission);

    if (permission === 'granted') {
      const state = await getSubscriptionState();
      setIsSubscribed(state.subscribed || false);
      console.log('OneSignal подписка активирована');
    }
  }, []);

  // Отписка от уведомлений
  const revokePermission = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).OneSignal) {
      await (window as any).OneSignal.Notifications.clearAll();
      const state = await getSubscriptionState();
      setIsSubscribed(state.subscribed || false);
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
