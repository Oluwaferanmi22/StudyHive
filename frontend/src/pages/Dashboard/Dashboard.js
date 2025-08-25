import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data for demo
  const studyGroups = [
    {
      id: 1,
      name: 'Mathematics 101',
      subject: 'Mathematics',
      members: 12,
      lastActivity: '2 hours ago',
      unreadMessages: 5,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      name: 'Biology Exam Prep',
      subject: 'Biology',
      members: 8,
      lastActivity: '4 hours ago',
      unreadMessages: 0,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 3,
      name: 'Programming Fundamentals',
      subject: 'Computer Science',
      members: 15,
      lastActivity: '1 day ago',
      unreadMessages: 2,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'message',
      text: 'New message in Mathematics 101',
      time: '30 minutes ago',
      icon: '💬'
    },
    {
      id: 2,
      type: 'resource',
      text: 'Sarah shared a new note in Biology Exam Prep',
      time: '1 hour ago',
      icon: '📚'
    },
    {
      id: 3,
      type: 'badge',
      text: 'You earned the "Helpful" badge!',
      time: '2 hours ago',
      icon: '🏆'
    },
    {
      id: 4,
      type: 'join',
      text: 'Alex joined Programming Fundamentals',
      time: '3 hours ago',
      icon: '👋'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-gray-600">Here's what's happening in your study hives today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600">
                <span className="text-white text-lg">🐝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Study Groups</p>
                <p className="text-2xl font-semibold text-gray-900">{user?.joinedGroups || 3}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
                <span className="text-white text-lg">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reputation</p>
                <p className="text-2xl font-semibold text-gray-900">{user?.reputation || 150}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                <span className="text-white text-lg">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badge</p>
                <p className="text-2xl font-semibold text-gray-900">{user?.badge || 'Helper'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                <span className="text-white text-lg">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-2xl font-semibold text-gray-900">7 days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Study Groups */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">My Study Groups</h2>
                  <Link
                    to="/study-groups"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {studyGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${group.color} flex items-center justify-center text-white font-semibold`}>
                          {group.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-600">{group.members} members • {group.lastActivity}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {group.unreadMessages > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {group.unreadMessages} new
                          </span>
                        )}
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Link
                    to="/study-groups"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="mr-2">+</span>
                    Join or Create New Group
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-lg">{activity.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="mr-3">📝</span>
                    Share a resource
                  </button>
                  <button className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="mr-3">❓</span>
                    Ask a question
                  </button>
                  <button className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="mr-3">📅</span>
                    Schedule study session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
