import React, { useState, useEffect } from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { useTheme } from '../../contexts/ThemeContext';

const StudyTimer = () => {
  const {
    mode,
    timeLeft,
    isRunning,
    isFocusMode,
    sessions,
    todaysFocusTime,
    currentTask,
    completedTasks,
    settings,
    start,
    pause,
    stop,
    reset,
    switchMode,
    addTask,
    formatTime,
    getProgress,
    TIMER_MODES,
    requestNotificationPermission
  } = useTimer();

  const { isDark } = useTheme();
  const [taskInput, setTaskInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Request notification permission on first load
    if (settings.notificationsEnabled && Notification.permission === 'default') {
      requestNotificationPermission();
    }
  }, [settings.notificationsEnabled]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (taskInput.trim()) {
      addTask(taskInput.trim());
      setTaskInput('');
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case TIMER_MODES.FOCUS:
        return 'text-red-600 dark:text-red-400';
      case TIMER_MODES.SHORT_BREAK:
        return 'text-green-600 dark:text-green-400';
      case TIMER_MODES.LONG_BREAK:
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getModeBackground = () => {
    switch (mode) {
      case TIMER_MODES.FOCUS:
        return 'from-red-500/20 to-pink-500/20';
      case TIMER_MODES.SHORT_BREAK:
        return 'from-green-500/20 to-emerald-500/20';
      case TIMER_MODES.LONG_BREAK:
        return 'from-blue-500/20 to-cyan-500/20';
      default:
        return 'from-gray-500/20 to-gray-600/20';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case TIMER_MODES.FOCUS:
        return 'Focus Time';
      case TIMER_MODES.SHORT_BREAK:
        return 'Short Break';
      case TIMER_MODES.LONG_BREAK:
        return 'Long Break';
      default:
        return 'Timer';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getModeBackground()} dark:from-gray-900 dark:to-gray-800 transition-all duration-500`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              🍅 Study Timer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay focused with the Pomodoro Technique
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Timer */}
            <div className="lg:col-span-2">
              <div className="dark-card rounded-2xl p-8 text-center">
                {/* Mode Selector */}
                <div className="flex justify-center mb-8">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
                    <button
                      onClick={() => switchMode(TIMER_MODES.FOCUS)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        mode === TIMER_MODES.FOCUS
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      Focus
                    </button>
                    <button
                      onClick={() => switchMode(TIMER_MODES.SHORT_BREAK)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        mode === TIMER_MODES.SHORT_BREAK
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                      }`}
                    >
                      Short Break
                    </button>
                    <button
                      onClick={() => switchMode(TIMER_MODES.LONG_BREAK)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        mode === TIMER_MODES.LONG_BREAK
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Long Break
                    </button>
                  </div>
                </div>

                {/* Timer Display */}
                <div className="mb-8">
                  <h2 className={`text-2xl font-semibold mb-4 ${getModeColor()}`}>
                    {getModeTitle()}
                  </h2>
                  
                  {/* Progress Ring */}
                  <div className="relative w-64 h-64 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                        className={getModeColor()}
                        style={{
                          transition: 'stroke-dashoffset 1s ease-in-out'
                        }}
                      />
                    </svg>
                    
                    {/* Time display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl font-mono font-bold text-gray-800 dark:text-white">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>

                  {/* Current Task */}
                  {currentTask && (
                    <div className="mb-6">
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Current task:</p>
                      <p className="font-medium text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                        {currentTask}
                      </p>
                    </div>
                  )}
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={isRunning ? pause : start}
                    className={`px-8 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 ${
                      isRunning
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  
                  <button
                    onClick={stop}
                    className="px-6 py-3 rounded-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white transition-all transform hover:scale-105"
                  >
                    Stop
                  </button>
                  
                  <button
                    onClick={reset}
                    className="px-6 py-3 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-105"
                  >
                    Reset
                  </button>
                </div>

                {/* Settings & Stats Buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    ⚙️ Settings
                  </button>
                  
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    📊 Stats
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Add Task */}
              <div className="dark-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  📝 Current Task
                </h3>
                
                <form onSubmit={handleAddTask} className="space-y-3">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="What are you working on?"
                    className="dark-input w-full px-3 py-2 rounded-lg text-sm"
                    maxLength={100}
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Set Task
                  </button>
                </form>
              </div>

              {/* Today's Stats */}
              <div className="dark-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  📈 Today's Progress
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Focus Time</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {Math.floor(todaysFocusTime / 60)}h {todaysFocusTime % 60}m
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Sessions</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {sessions}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t dark-border">
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      Daily Goal Progress
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((todaysFocusTime / 120) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-right">
                      Goal: 2 hours
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="dark-card rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    ✅ Recent Tasks
                  </h3>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {completedTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="text-sm">
                        <div className="font-medium text-gray-800 dark:text-white truncate">
                          {task.task}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(task.completedAt).toLocaleTimeString()} • {task.duration}min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Modal */}
          {showSettings && (
            <SettingsModal
              settings={settings}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Stats Modal */}
          {showStats && (
            <StatsModal
              stats={{
                sessions,
                todaysFocusTime,
                completedTasks
              }}
              onClose={() => setShowStats(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ settings, onClose }) => {
  const { updateSettings } = useTimer();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="dark-card rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Timer Settings
        </h2>
        
        <div className="space-y-4">
          {/* Duration Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Focus Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.focusDuration}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                focusDuration: parseInt(e.target.value) || 25
              }))}
              className="dark-input w-full px-3 py-2 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={localSettings.shortBreakDuration}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                shortBreakDuration: parseInt(e.target.value) || 5
              }))}
              className="dark-input w-full px-3 py-2 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Long Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localSettings.longBreakDuration}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                longBreakDuration: parseInt(e.target.value) || 15
              }))}
              className="dark-input w-full px-3 py-2 rounded-lg"
            />
          </div>
          
          {/* Toggle Settings */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.autoStartBreaks}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  autoStartBreaks: e.target.checked
                }))}
                className="mr-3 h-4 w-4 text-primary-600 rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-start breaks
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  soundEnabled: e.target.checked
                }))}
                className="mr-3 h-4 w-4 text-primary-600 rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Play sound on completion
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.notificationsEnabled}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  notificationsEnabled: e.target.checked
                }))}
                className="mr-3 h-4 w-4 text-primary-600 rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable notifications
              </span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Stats Modal Component
const StatsModal = ({ stats, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="dark-card rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Study Statistics
        </h2>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {stats.sessions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Focus sessions completed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {Math.floor(stats.todaysFocusTime / 60)}h {stats.todaysFocusTime % 60}m
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Focus time today
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.completedTasks.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tasks completed
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
