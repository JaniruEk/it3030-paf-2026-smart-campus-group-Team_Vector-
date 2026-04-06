import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  recipientId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getApiUrl = () => {
    const host = window.location.hostname;
    return host === 'localhost' ? 'http://localhost:8080/api/v1' : `http://${host}:8080/api/v1`;
  };

  const notifyUrl = getApiUrl();
  const wsUrl = notifyUrl.replace('/api/v1', '/ws');

  // Initial fetch REST to get history
  const fetchNotifications = async (token: string) => {
    try {
      const response = await fetch(`${notifyUrl}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map((n: any) => ({
            ...n,
            isRead: n.read !== undefined ? n.read : n.isRead
        }));
        setNotifications(mappedData);
      }
    } catch (e) {
      console.error("Failed to fetch initial notifications", e);
    }
  };

  useEffect(() => {
    let client: Client | null = null;
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const connectWebSocket = async () => {
      try {
        const token = await currentUser.getIdToken();
        await fetchNotifications(token);

        client = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },
          reconnectDelay: 5000,
          onConnect: () => {
            console.log("WebSocket connected for Notifications!");
            client?.subscribe(`/topic/notifications/${currentUser.uid}`, (message) => {
              if (message.body) {
                const rawNotification = JSON.parse(message.body);
                const newNotification: Notification = {
                    ...rawNotification,
                    isRead: rawNotification.read !== undefined ? rawNotification.read : rawNotification.isRead
                };
                setNotifications(prev => [newNotification, ...prev]);
                toast.success(newNotification.message, { 
                    duration: 5000, 
                    position: 'top-right',
                    style: { fontWeight: 'bold' }
                });
              }
            });
          },
          onStompError: (frame) => {
            console.error('STOMP Broker error: ' + frame.headers['message']);
          },
        });

        client.activate();

      } catch (e) {
        console.error("Failed to initialize WebSocket", e);
      }
    };

    connectWebSocket();

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [currentUser]);

  const markAsRead = async (id: string) => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${notifyUrl}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch(e) { console.error(e); }
  };

  const deleteNotification = async (id: string) => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${notifyUrl}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch(e) { console.error(e); }
  }

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${notifyUrl}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch(e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
