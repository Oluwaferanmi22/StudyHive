import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  TIMER: 'timer',
  MESSAGE: 'message',
  ACHIEVEMENT: 'achievement'
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    enableBrowserNotifications: true,
    enableSounds: true,
    showTimerNotifications: true,
    showMessageNotifications: true,
    showAchievementNotifications: true,
    autoHideDelay: 5000 // 5 seconds
  });
  const { isAuthenticated } = useAuth();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('studyhive_notification_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show in-app notification
  const showNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date(),
      autoHide: options.autoHide !== false,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      ...options
    };

    setNotifications(prev => [notification, ...prev]);

    // Auto-hide notification
    if (notification.autoHide) {
      setTimeout(() => {
        hideNotification(id);
      }, options.duration || settings.autoHideDelay);
    }

    // Show browser notification if enabled
    if (settings.enableBrowserNotifications && isAuthenticated) {
      showBrowserNotification(message, type, options);
    }

    // Play sound if enabled
    if (settings.enableSounds) {
      playNotificationSound(type);
    }

    return id;
  }, [settings, isAuthenticated]);

  // Show browser notification
  const showBrowserNotification = useCallback(async (message, type, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const iconMap = {
      [NOTIFICATION_TYPES.SUCCESS]: '✅',
      [NOTIFICATION_TYPES.ERROR]: '❌',
      [NOTIFICATION_TYPES.WARNING]: '⚠️',
      [NOTIFICATION_TYPES.INFO]: 'ℹ️',
      [NOTIFICATION_TYPES.TIMER]: '🍅',
      [NOTIFICATION_TYPES.MESSAGE]: '💬',
      [NOTIFICATION_TYPES.ACHIEVEMENT]: '🏆'
    };

    const notification = new Notification(`StudyHive ${iconMap[type] || ''}`, {
      body: message,
      icon: '/favicon.ico',
      tag: options.tag || `studyhive-${type}`,
      requireInteraction: type === NOTIFICATION_TYPES.ERROR,
      silent: !settings.enableSounds
    });

    // Auto-close browser notification
    setTimeout(() => {
      notification.close();
    }, options.duration || settings.autoHideDelay);

    return notification;
  }, [settings]);

  // Hide notification
  const hideNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update notification settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('studyhive_notification_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback((type) => {
    if (!settings.enableSounds) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different types
      const frequencies = {
        [NOTIFICATION_TYPES.SUCCESS]: 800,
        [NOTIFICATION_TYPES.ERROR]: 400,
        [NOTIFICATION_TYPES.WARNING]: 600,
        [NOTIFICATION_TYPES.INFO]: 500,
        [NOTIFICATION_TYPES.TIMER]: 700,
        [NOTIFICATION_TYPES.MESSAGE]: 650,
        [NOTIFICATION_TYPES.ACHIEVEMENT]: 900
      };

      const frequency = frequencies[type] || 500;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [settings.enableSounds]);

  // Convenience methods for different notification types
  const showSuccess = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.SUCCESS, options);
  }, [showNotification]);

  const showError = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.ERROR, { autoHide: false, ...options });
  }, [showNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.WARNING, options);
  }, [showNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.INFO, options);
  }, [showNotification]);

  const showTimerNotification = useCallback((message, options = {}) => {
    if (!settings.showTimerNotifications) return null;
    return showNotification(message, NOTIFICATION_TYPES.TIMER, options);
  }, [showNotification, settings.showTimerNotifications]);

  const showMessageNotification = useCallback((message, options = {}) => {
    if (!settings.showMessageNotifications) return null;
    return showNotification(message, NOTIFICATION_TYPES.MESSAGE, options);
  }, [showNotification, settings.showMessageNotifications]);

  const showAchievementNotification = useCallback((message, options = {}) => {
    if (!settings.showAchievementNotifications) return null;
    return showNotification(message, NOTIFICATION_TYPES.ACHIEVEMENT, { duration: 8000, ...options });
  }, [showNotification, settings.showAchievementNotifications]);

  // Initialize notification permission
  useEffect(() => {
    if (settings.enableBrowserNotifications && isAuthenticated) {
      requestPermission();
    }
  }, [settings.enableBrowserNotifications, isAuthenticated, requestPermission]);

  const value = {
    // State
    notifications,
    settings,

    // Core methods
    showNotification,
    hideNotification,
    clearAllNotifications,
    requestPermission,
    updateSettings,

    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTimerNotification,
    showMessageNotification,
    showAchievementNotification,

    // Constants
    NOTIFICATION_TYPES
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
