import React, { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications, type Notification } from '../context/NotificationContext';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markAsRead(id);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification(id);
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
                        <h4>Alerts</h4>
                        {unreadCount > 0 && <span className="unread-text">{unreadCount} new</span>}
                    </div>
                    <div className="panel-body">
                        {notifications.length === 0 ? (
                            <div className="empty-state">No new notifications.</div>
                        ) : (
                            notifications.map((n: Notification) => (
                                <div key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`}>
                                    <div className="notification-content">
                                        <div className="notification-meta">
                                            <span className="type-badge">{n.type}</span>
                                        </div>
                                        <p>{n.message}</p>
                                    </div>
                                    <div className="notification-actions">
                                        {!n.isRead && (
                                            <button onClick={(e) => handleMarkAsRead(n.id, e)} title="Mark as Read" className="action-btn success"><Check size={16}/></button>
                                        )}
                                        <button onClick={(e) => handleDelete(n.id, e)} title="Dismiss" className="action-btn danger"><Trash2 size={16}/></button>
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
