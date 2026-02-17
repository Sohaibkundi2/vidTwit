import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

dayjs.extend(relativeTime);

const NotificationList = ({ onClose, onRead, onAllRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data?.data?.docs || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
        socket.on('new-notification', (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
        });

        return () => {
            socket.off('new-notification');
        };
    }
  }, [socket]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      if (onRead) onRead();
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if (onAllRead) onAllRead();
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleDelete = async (e, id, read) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (!read && onRead) onRead(); // If deleting unread, decrement count
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (loading) return <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-700 p-4 text-center text-white">Loading notifications...</div>;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-700">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-950">
        <h3 className="font-semibold text-white">Notifications</h3>
        <button onClick={handleMarkAllRead} className="text-xs text-blue-400 hover:text-blue-300">
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No notifications</div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`p-3 border-b border-gray-800 hover:bg-gray-800 transition relative group ${!notification.read ? 'bg-gray-800/50' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                 <Link
                    to={notification.url || '#'}
                    onClick={() => {
                        if(!notification.read) handleMarkRead(notification._id);
                        if(onClose) onClose();
                    }}
                    className="flex items-start gap-3 flex-1"
                >
                    <img
                    src={notification.sender?.avatar || "/default-avatar.png"}
                    className="w-8 h-8 rounded-full object-cover mt-1"
                    alt="avatar"
                    />
                    <div className="flex-1">
                    <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {dayjs(notification.createdAt).fromNow()}
                    </p>
                    </div>
                </Link>
                <button
                    onClick={(e) => handleDelete(e, notification._id, notification.read)}
                    className="text-gray-500 hover:text-red-400 p-1"
                >
                    ×
                </button>
              </div>

              {!notification.read && (
                <div className="absolute top-1/2 right-2 w-2 h-2 bg-blue-500 rounded-full transform -translate-y-1/2 pointer-events-none"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
