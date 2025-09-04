import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationDemo = () => {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTimerNotification,
    showMessageNotification,
    showAchievementNotification,
    clearAllNotifications,
    requestPermission
  } = useNotifications();

  const testNotifications = [
    {
      label: '✅ Success',
      action: () => showSuccess('Task completed successfully!', {
        actionLabel: 'View Details',
        onAction: () => console.log('Success action clicked')
      }),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      label: '❌ Error',
      action: () => showError('Something went wrong. Please try again.', {
        actionLabel: 'Retry',
        onAction: () => console.log('Retry action clicked')
      }),
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      label: '⚠️ Warning',
      action: () => showWarning('Your session will expire in 5 minutes.'),
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      label: 'ℹ️ Info',
      action: () => showInfo('New study material is available.'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      label: '🍅 Timer',
      action: () => showTimerNotification('Focus session completed! Time for a break.'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      label: '💬 Message',
      action: () => showMessageNotification('New message from your study group.', {
        actionLabel: 'Open Chat',
        onAction: () => console.log('Open chat action clicked')
      }),
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      label: '🏆 Achievement',
      action: () => showAchievementNotification('Congratulations! You completed 10 focus sessions today!', {
        actionLabel: 'View Badge',
        onAction: () => console.log('View badge action clicked')
      }),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="dark-card rounded-xl p-6 max-w-md">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        🔔 Notification Demo
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test different types of notifications to see how they work.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {testNotifications.map((notification, index) => (
          <button
            key={index}
            onClick={notification.action}
            className={`${notification.color} text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors`}
          >
            {notification.label}
          </button>
        ))}
      </div>

      <div className="border-t dark-border pt-4">
        <div className="flex space-x-2">
          <button
            onClick={requestPermission}
            className="flex-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Enable Browser Notifications
          </button>
          
          <button
            onClick={clearAllNotifications}
            className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;
