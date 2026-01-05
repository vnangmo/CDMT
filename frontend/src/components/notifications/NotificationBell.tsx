import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../services/notification.service';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead } = useNotifications({
    limit: 5,
    autoRefresh: true,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to link if available
    if (notification.link) {
      navigate(notification.link);
    }

    setIsOpen(false);
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setIsOpen(false);
  };

  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="notification-bell__count">{unreadCount} non lues</span>}
          </div>

          <div className="notification-bell__list">
            {notifications.length === 0 ? (
              <div className="notification-bell__empty">Aucune notification</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-bell__item ${!notification.isRead ? 'notification-bell__item--unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-bell__item-content">
                    <div className="notification-bell__item-title">{notification.title}</div>
                    <div className="notification-bell__item-message">{notification.message}</div>
                    <div className="notification-bell__item-time">{getTimeAgo(notification.createdAt)}</div>
                  </div>
                  {!notification.isRead && <div className="notification-bell__item-dot"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-bell__footer">
              <button onClick={handleViewAll} className="notification-bell__view-all">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
