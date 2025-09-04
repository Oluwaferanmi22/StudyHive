import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationContainer = () => {
  const { notifications, hideNotification, NOTIFICATION_TYPES } = useNotifications();

  const getNotificationStyles = (type) => {
    const baseStyles = "max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden";
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} border-l-4 border-green-400`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} border-l-4 border-red-400`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} border-l-4 border-yellow-400`;
      case NOTIFICATION_TYPES.TIMER:
        return `${baseStyles} border-l-4 border-orange-400`;
      case NOTIFICATION_TYPES.MESSAGE:
        return `${baseStyles} border-l-4 border-blue-400`;
      case NOTIFICATION_TYPES.ACHIEVEMENT:
        return `${baseStyles} border-l-4 border-purple-400`;
      default:
        return `${baseStyles} border-l-4 border-gray-400`;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case NOTIFICATION_TYPES.ERROR:
        return (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case NOTIFICATION_TYPES.WARNING:
        return (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case NOTIFICATION_TYPES.TIMER:
        return (
          <div className="flex-shrink-0">
            <div className="h-6 w-6 text-orange-400 flex items-center justify-center text-lg">
              🍅
            </div>
          </div>
        );
      case NOTIFICATION_TYPES.MESSAGE:
        return (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case NOTIFICATION_TYPES.ACHIEVEMENT:
        return (
          <div className="flex-shrink-0">
            <div className="h-6 w-6 text-purple-400 flex items-center justify-center text-lg">
              🏆
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 24 hours
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {notifications.slice(0, 5).map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationStyles(notification.type)} slide-in-down`}
        >
          <div className="p-4">
            <div className="flex items-start">
              {getNotificationIcon(notification.type)}
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(notification.timestamp)}
                </p>
                {notification.actionLabel && notification.onAction && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        notification.onAction();
                        hideNotification(notification.id);
                      }}
                      className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                    >
                      {notification.actionLabel}
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => hideNotification(notification.id)}
                  className="bg-transparent rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Show More Button */}
      {notifications.length > 5 && (
        <div className="max-w-md w-full bg-gray-50 dark:bg-gray-700 shadow-sm rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {notifications.length - 5} more notifications
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationContainer;
