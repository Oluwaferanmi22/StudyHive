import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

// Timer modes
export const TIMER_MODES = {
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak'
};

// Default durations in minutes
export const DEFAULT_DURATIONS = {
  [TIMER_MODES.FOCUS]: 25,
  [TIMER_MODES.SHORT_BREAK]: 5,
  [TIMER_MODES.LONG_BREAK]: 15
};

export const TimerProvider = ({ children }) => {
  const [mode, setMode] = useState(TIMER_MODES.FOCUS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS[TIMER_MODES.FOCUS] * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [todaysFocusTime, setTodaysFocusTime] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [settings, setSettings] = useState({
    focusDuration: DEFAULT_DURATIONS[TIMER_MODES.FOCUS],
    shortBreakDuration: DEFAULT_DURATIONS[TIMER_MODES.SHORT_BREAK],
    longBreakDuration: DEFAULT_DURATIONS[TIMER_MODES.LONG_BREAK],
    autoStartBreaks: false,
    autoStartFocus: false,
    soundEnabled: true,
    notificationsEnabled: true,
    longBreakInterval: 4 // Every 4 focus sessions
  });

  // Load settings and stats from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('studyhive_timer_settings');
    const savedStats = localStorage.getItem('studyhive_timer_stats');
    const savedTodayStats = localStorage.getItem('studyhive_timer_today');

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setTimeLeft(parsed.focusDuration * 60);
      } catch (error) {
        console.error('Error loading timer settings:', error);
      }
    }

    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setTotalFocusTime(parsed.totalFocusTime || 0);
        setSessions(parsed.sessions || 0);
        setCompletedTasks(parsed.completedTasks || []);
      } catch (error) {
        console.error('Error loading timer stats:', error);
      }
    }

    if (savedTodayStats) {
      try {
        const parsed = JSON.parse(savedTodayStats);
        const today = new Date().toDateString();
        if (parsed.date === today) {
          setTodaysFocusTime(parsed.focusTime || 0);
        } else {
          // Reset daily stats for new day
          setTodaysFocusTime(0);
          localStorage.setItem('studyhive_timer_today', JSON.stringify({
            date: today,
            focusTime: 0
          }));
        }
      } catch (error) {
        console.error('Error loading today\'s timer stats:', error);
      }
    }
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft]);

  // Save stats to localStorage
  const saveStats = useCallback(() => {
    localStorage.setItem('studyhive_timer_stats', JSON.stringify({
      totalFocusTime,
      sessions,
      completedTasks,
      lastUpdated: new Date().toISOString()
    }));

    const today = new Date().toDateString();
    localStorage.setItem('studyhive_timer_today', JSON.stringify({
      date: today,
      focusTime: todaysFocusTime
    }));
  }, [totalFocusTime, sessions, completedTasks, todaysFocusTime]);

  // Auto-save stats periodically
  useEffect(() => {
    saveStats();
  }, [saveStats]);

  const handleTimerComplete = () => {
    setIsActive(false);
    setIsPaused(false);

    if (mode === TIMER_MODES.FOCUS) {
      const newSessions = sessions + 1;
      const sessionDuration = settings.focusDuration;
      
      setSessions(newSessions);
      setTotalFocusTime(prev => prev + sessionDuration);
      setTodaysFocusTime(prev => prev + sessionDuration);

      // Add completed task if there was one
      if (currentTask.trim()) {
        const newTask = {
          id: Date.now(),
          task: currentTask,
          completedAt: new Date().toISOString(),
          duration: sessionDuration
        };
        setCompletedTasks(prev => [newTask, ...prev]);
        setCurrentTask('');
      }

      // Determine next mode
      const nextMode = newSessions % settings.longBreakInterval === 0 
        ? TIMER_MODES.LONG_BREAK 
        : TIMER_MODES.SHORT_BREAK;
      
      switchMode(nextMode);

      // Show notification
      if (settings.notificationsEnabled) {
        showNotification('Focus session complete! Time for a break.');
      }

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => start(), 1000);
      }
    } else {
      // Break completed
      switchMode(TIMER_MODES.FOCUS);
      
      if (settings.notificationsEnabled) {
        showNotification('Break time over! Ready to focus?');
      }

      // Auto-start focus if enabled
      if (settings.autoStartFocus) {
        setTimeout(() => start(), 1000);
      }
    }

    // Play completion sound
    if (settings.soundEnabled) {
      playCompletionSound();
    }
  };

  const start = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const pause = () => {
    setIsPaused(!isPaused);
  };

  const stop = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(settings[`${mode}Duration`] * 60);
  };

  const reset = () => {
    stop();
    switchMode(TIMER_MODES.FOCUS);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(settings[`${newMode}Duration`] * 60);
    setIsActive(false);
    setIsPaused(false);
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('studyhive_timer_settings', JSON.stringify(updated));
      
      // Update current timer if not active
      if (!isActive) {
        setTimeLeft(updated[`${mode}Duration`] * 60);
      }
      
      return updated;
    });
  };

  const showNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('StudyHive Timer', {
        body: message,
        icon: '/favicon.ico',
        tag: 'studyhive-timer'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const playCompletionSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing completion sound:', error);
    }
  };

  const addTask = (task) => {
    setCurrentTask(task);
  };

  const clearCompletedTasks = () => {
    setCompletedTasks([]);
    localStorage.removeItem('studyhive_timer_stats');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalSeconds = settings[`${mode}Duration`] * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const value = {
    // State
    mode,
    timeLeft,
    isActive,
    isPaused,
    sessions,
    totalFocusTime,
    todaysFocusTime,
    currentTask,
    completedTasks,
    settings,

    // Actions
    start,
    pause,
    stop,
    reset,
    switchMode,
    updateSettings,
    addTask,
    clearCompletedTasks,
    requestNotificationPermission,

    // Utilities
    formatTime,
    getProgress,
    
    // Computed values
    isRunning: isActive && !isPaused,
    isFocusMode: mode === TIMER_MODES.FOCUS,
    isBreakMode: mode !== TIMER_MODES.FOCUS,
    
    // Timer modes
    TIMER_MODES
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
