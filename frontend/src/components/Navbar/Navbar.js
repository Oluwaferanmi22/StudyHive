import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/contexts/AuthContext';
import ThemeToggle from '../Common/ThemeToggle';
import socketService from '../../services/socketService';
import { hivesAPI } from '../../services/apiService';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]); // {id,type,text,time,meta,read}
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Notifications via socket
  useEffect(() => {
    // Hydrate from localStorage
    try {
      const saved = localStorage.getItem('studyhive_bell_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } catch (_) {}

    const onJoinRequest = (data) => {
      const item = {
        id: `jr_${data.requestId}`,
        type: 'join_request',
        text: `${data.requesterName} requested to join your hive`,
        time: new Date(data.requestedAt || Date.now()),
        meta: { hiveId: data.hiveId, requestId: data.requestId, requesterId: data.requesterId },
        read: false,
      };
      setNotifications((prev) => [item, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };

    const onJoinRequestUpdate = (data) => {
      const verb = data.action === 'approve' || data.status === 'approved' ? 'approved' : 'rejected';
      const item = {
        id: `jru_${data.requestId}_${data.status}`,
        type: 'join_request_update',
        text: `Your request to join a hive was ${verb}`,
        time: new Date(data.reviewedAt || Date.now()),
        meta: { hiveId: data.hiveId, requestId: data.requestId, status: data.status },
        read: false,
      };
      setNotifications((prev) => [item, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };

    // Optional: mentions support if server emits mention_notification already
    const onMention = (data) => {
      const item = {
        id: `mn_${Date.now()}`,
        type: 'mention',
        text: `You were mentioned in ${data.hiveName || 'a hive'}`,
        time: new Date(),
        meta: { hiveId: data.hiveId, messageId: data.messageId },
        read: false,
      };
      setNotifications((prev) => [item, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };

    socketService.on('hive_join_request', onJoinRequest);
    socketService.on('hive_join_request_update', onJoinRequestUpdate);
    socketService.on('mention_notification', onMention);

    return () => {
      socketService.off('hive_join_request', onJoinRequest);
      socketService.off('hive_join_request_update', onJoinRequestUpdate);
      socketService.off('mention_notification', onMention);
    };
  }, []);

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem('studyhive_bell_notifications', JSON.stringify(notifications));
    } catch (_) {}
  }, [notifications]);

  const openNotifications = () => {
    setIsNotifOpen((o) => !o);
    if (!isNotifOpen && unreadCount > 0) {
      // Mark visible items as read when opening
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const onNotificationClick = (n) => {
    setIsNotifOpen(false);
    if (n.type === 'join_request' && n.meta?.hiveId) {
      navigate(`/study-groups/${n.meta.hiveId}`);
    } else if (n.type === 'mention' && n.meta?.hiveId) {
      navigate(`/study-groups/${n.meta.hiveId}`);
    } else {
      // default
      navigate('/study-groups');
    }
  };

  const handleRequestAction = async (n, action) => {
    if (!n?.meta?.hiveId || !n?.meta?.requestId) return;
    try {
      await hivesAPI.manageJoinRequest(n.meta.hiveId, n.meta.requestId, action);
      // Update the notification item to reflect outcome
      setNotifications(prev => prev.map(item => item.id === n.id ? {
        ...item,
        type: 'join_request_update',
        text: `You ${action}d a join request`,
        read: true,
        time: new Date()
      } : item));
    } catch (e) {
      // Navigate to hive so the user can manage there if permission required
      navigate(`/study-groups/${n.meta.hiveId}`);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-gray-800 shadow-lg z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center">
              <div className="text-2xl">🐝</div>
              <span className="ml-2 text-xl font-bold text-primary-600">
                StudyHive
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <ThemeToggle className="mr-4" />
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/study-groups"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Study Groups
                </Link>
                <Link
                  to="/ai-tutor"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  🤖 AI Tutor
                </Link>
                <Link
                  to="/study-timer"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  ⏱️ Study Time
                </Link>
                <Link
                  to="/upgrade"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  🚀 Upgrade
                </Link>
              </>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={openNotifications}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Notifications"
                >
                  <span className="sr-only">Notifications</span>
                  <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Notifications</span>
                      <button
                        onClick={() => { setNotifications([]); setUnreadCount(0); }}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      {notifications.length === 0 && (
                        <li className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No notifications</li>
                      )}
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            onClick={() => onNotificationClick(n)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${!n.read ? 'bg-primary-50/40 dark:bg-gray-700/40' : ''}`}
                          >
                            <div className="flex items-start">
                              <div className="mt-0.5 mr-3">
                                {n.type === 'join_request' ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">✉️</span>
                                ) : n.type === 'join_request_update' ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">✔️</span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600">@</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800 dark:text-gray-100">{n.text}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                {n.type === 'join_request' && (
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleRequestAction(n, 'approve'); }}
                                      className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleRequestAction(n, 'reject'); }}
                                      className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-right">
                      <button
                        onClick={() => { setIsNotifOpen(false); navigate('/notifications'); }}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu or Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <div className="flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-full">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                      {(user?.profile?.firstName || user?.username || 'U')?.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-700">{user?.profile?.firstName || user?.username || 'User'}</span>
                    {user?.isPremium && (
                      <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Premium
                      </div>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/study-groups"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Study Groups
                  </Link>
                  <Link
                    to="/ai-tutor"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AI Tutor
                  </Link>
                  <Link
                    to="/study-timer"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Study Time
                  </Link>
                  <Link
                    to="/upgrade"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Upgrade
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    Sign out
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
