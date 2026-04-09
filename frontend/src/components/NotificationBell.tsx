import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, Trash2, MailOpen, Inbox, X, ExternalLink } from 'lucide-react';
import { useNotifications, type Notification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const { userRole } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Global click listener to close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markAsRead(id);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const handleItemClick = (n: Notification) => {
        setSelectedNotification(n);
        if (!n.isRead) {
            markAsRead(n.id);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const getTagClass = (type: string) => {
        const t = type.toLowerCase();
        if (t === 'broadcast') return 'broadcast';
        if (t === 'role_update') return 'role_update';
        if (t.includes('ticket') || t.includes('task') || t.includes('comment')) return 'maintenance';
        if (t.includes('booking') || t === 'status_change') return 'booking';
        if (t.includes('asset')) return 'asset';
        return 'default';
    };

    const getNotificationRoute = (n: Notification) => {
        const t = n.type?.toUpperCase() || '';
        const role = userRole?.toUpperCase();
        const rid = n.resourceId;
        
        console.log(`[NotificationBell] Calculating route for Type: ${t}, Role: ${role}, ResourceId: ${rid}`);

        let target = '/';

        // Maintenance Tickets Mapping
        if (t.includes('TICKET') || t.includes('TASK') || t.includes('COMMENT')) {
            if (role === 'ADMIN') target = '/admin/tickets';
            else if (role === 'TECHNICIAN') target = '/technician/tickets';
            else target = '/tickets';
        }
        // Bookings Mapping
        else if (t.includes('BOOKING') || t === 'STATUS_CHANGE') {
            if (role === 'ADMIN') target = '/admin?tab=bookings';
            else {
                // Determine if it's an asset or facility booking based on message content
                const msg = n.message.toLowerCase();
                if (msg.includes('asset') || msg.includes('equipment')) {
                    target = '/book-asset';
                } else {
                    target = '/book-facility';
                }
            }
        }
        // Assets Catalogue Mapping
        else if (t.includes('ASSET')) {
            if (role === 'ADMIN') target = '/admin?tab=assets';
            else target = '/facilities';
        } 
        // Role Updates
        else if (t === 'ROLE_UPDATE') {
            target = role === 'ADMIN' ? '/admin' : '/dashboard';
        }
        else {
            return null;
        }

        if (rid) {
            target += (target.includes('?') ? '&' : '?') + `id=${rid}`;
        }
        return target;
    };

    const handleActionClick = (n: Notification) => {
        const route = getNotificationRoute(n);
        console.log(`[NotificationBell] Action button clicked. Target Route: ${route}`);
        
        if (route) {
            setSelectedNotification(null);
            setIsOpen(false);
            
            // Allow state to settle before navigation
            setTimeout(() => {
                navigate(route);
            }, 10);
        } else {
            console.warn(`[NotificationBell] No route found for notification type: ${n.type}`);
        }
    };

    return (
        <div className="notification-wrapper" ref={panelRef}>
            <button className="icon-button" onClick={() => setIsOpen(!isOpen)} title="Notifications">
                <Bell size={22} strokeWidth={2} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            
            {isOpen && (
                <div className="notification-panel">
                    <div className="panel-header">
                        <div className="header-title-group">
                            <h4>Alerts</h4>
                            {unreadCount > 0 && <span className="unread-badge-pill">{unreadCount} new</span>}
                        </div>
                        <button 
                            className="mark-all-btn" 
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <MailOpen size={14} style={{ marginRight: '4px' }} />
                            Mark all as read
                        </button>
                    </div>
                    <div className="panel-body">
                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <Inbox size={48} className="empty-icon" />
                                <p>Your inbox is clear!</p>
                            </div>
                        ) : (
                            notifications.map((n: Notification) => (
                                <div 
                                    key={n.id} 
                                    className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                                    onClick={() => handleItemClick(n)}
                                >
                                    {!n.isRead && <div className="unread-indicator" />}
                                    <div className="notification-content">
                                        <div className="notification-meta">
                                            <span className={`type-tag ${getTagClass(n.type)}`}>
                                                {n.type.replace('_', ' ')}
                                            </span>
                                            <span className="time-stamp">{formatTime(n.createdAt)}</span>
                                        </div>
                                        <p>{n.message}</p>
                                    </div>
                                    <div className="notification-actions">
                                        {!n.isRead && (
                                            <button onClick={(e) => handleMarkAsRead(n.id, e)} title="Mark as Read" className="circle-btn check"><Check size={16}/></button>
                                        )}
                                        <button onClick={(e) => handleDelete(n.id, e)} title="Dismiss" className="circle-btn delete"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {selectedNotification && document.body && createPortal(
                <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedNotification(null)}>
                            <X size={20} />
                        </button>
                        
                        <div className="modal-header">
                            <span className={`type-tag ${getTagClass(selectedNotification.type)}`}>
                                {selectedNotification.type.replace('_', ' ')}
                            </span>
                            <h2>Alert Details</h2>
                        </div>
                        
                        <div className="modal-body">
                            <p>{selectedNotification.message}</p>
                        </div>
                        
                        <div className="modal-footer">
                            <div className="modal-metadata">
                                <span className="modal-time">{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                                <div className="modal-status">
                                    {selectedNotification.isRead ? 'Status: Read' : 'Status: New'}
                                </div>
                            </div>
                            
                            {getNotificationRoute(selectedNotification) && (
                                <button 
                                    className="action-link-btn"
                                    onClick={() => handleActionClick(selectedNotification)}
                                >
                                    <ExternalLink size={16} />
                                    View Resource Details
                                </button>
                            )}
                        </div>
                    </div>
                </div>, 
                document.body
            )}
        </div>
    );
};

export default NotificationBell;
