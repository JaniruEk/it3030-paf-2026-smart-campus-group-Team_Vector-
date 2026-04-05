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
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initial fetch REST to get history
  const fetchNotifications = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
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
          webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },
          reconnectDelay: 5000,
          onConnect: () => {
            console.log("WebSocket connected for Notifications!");
            client?.subscribe('/user/queue/notifications', (message) => {
              if (message.body) {
                const newNotification: Notification = JSON.parse(message.body);
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
      await fetch(`http://localhost:8080/api/v1/notifications/${id}/read`, {
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
      await fetch(`http://localhost:8080/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch(e) { console.error(e); }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
