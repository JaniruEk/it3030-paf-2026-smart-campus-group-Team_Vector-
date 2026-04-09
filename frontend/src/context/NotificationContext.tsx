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
  resourceId?: string;
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
  const { currentUser, userRole } = useAuth();
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
    let isMounted = true;

    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const connectWebSocket = async () => {
      try {
        const token = await currentUser.getIdToken();
        if (!isMounted) return;

        await fetchNotifications(token);
        if (!isMounted) return;

        console.log(`Initializing WebSocket for user ${currentUser.uid} with role ${userRole || 'pending'}`);

        const stompClient = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        stompClient.beforeConnect = async () => {
          try {
            const freshToken = await currentUser.getIdToken(true);
            stompClient.connectHeaders = {
              'Authorization': `Bearer ${freshToken}`,
            };
          } catch (err) {
            console.error("Failed to refresh token before WebSocket connect", err);
          }
        };

        stompClient.onConnect = () => {
          if (!isMounted) return;
          console.log("WebSocket connected! Subscribing to topics...");

          stompClient.subscribe(`/topic/notifications/${currentUser.uid}`, (message) => {
            handleIncomingNotification(message);
          });

          stompClient.subscribe('/topic/broadcasts/ALL', (message) => {
            handleIncomingNotification(message);
          });

          if (userRole) {
            const roleTopic = `/topic/broadcasts/${userRole.toUpperCase()}`;
            console.log(`Subscribing to role topic: ${roleTopic}`);
            stompClient.subscribe(roleTopic, (message) => {
              handleIncomingNotification(message);
            });
          }
        };

        stompClient.onStompError = (frame) => {
          console.error('STOMP Broker error: ' + frame.headers['message']);
        };

        stompClient.onWebSocketClose = () => {
          if (isMounted) console.log("WebSocket connection closed.");
        };

        const handleIncomingNotification = (message: any) => {
          if (message.body) {
            try {
              const rawNotification = JSON.parse(message.body);
              const newNotification: Notification = {
                ...rawNotification,
                isRead: rawNotification.read !== undefined ? rawNotification.read : rawNotification.isRead
              };

              if (isMounted) {
                setNotifications(prev => {
                  if (prev.some(n => n.id === newNotification.id)) return prev;
                  return [newNotification, ...prev];
                });

                toast.success(newNotification.message, {
                  duration: 5000,
                  position: 'top-right',
                  style: { fontWeight: 'bold' }
                });

                // Play notification sound
                const audio = new Audio('/notification-sound.mp3');
                audio.play().catch(e => console.error("Error playing notification sound:", e));
              }
            } catch (err) {
              console.error("Error parsing incoming message:", err);
            }
          }
        };

        client = stompClient;
        stompClient.activate();

      } catch (e) {
        console.error("Failed to initialize WebSocket", e);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (client) {
        console.log("Deactivating WebSocket client...");
        client.deactivate();
      }
    };
  }, [currentUser, userRole]);

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
    } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
