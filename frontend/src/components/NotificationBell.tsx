import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import './NotificationBell.css';

interface Notification {
    id: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await apiClient.get('/notifications');
            const data = await res.data;
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.read).length);
        } catch(e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds for the "Creativity" marks
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch(e) {
            console.error(e);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiClient.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch(e) {
            console.error(e);
        }
    };

    return (
        <div className="notification-wrapper">
            <button className="icon-button" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            
            {isOpen && (
                <div className="notification-panel">
                    <div className="panel-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && <span className="unread-text">{unreadCount} new</span>}
                    </div>
                    <div className="panel-body">
                        {notifications.length === 0 ? (
                            <div className="empty-state">No notifications.</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                                    <div className="notification-content">
                                        <div className="notification-meta">
                                            <span className="type-badge">{n.type}</span>
                                            <span className="time">{new Date(n.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p>{n.message}</p>
                                    </div>
                                    <div className="notification-actions">
                                        {!n.read && (
                                            <button onClick={(e) => markAsRead(n.id, e)} title="Mark as Read" className="action-btn success"><Check size={16}/></button>
                                        )}
                                        <button onClick={(e) => deleteNotification(n.id, e)} title="Delete" className="action-btn danger"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
