import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Gamification = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock leaderboard data
  const leaderboard = [
    {
      id: '1',
      name: 'Emma Davis',
      reputation: 2150,
      badge: 'Expert',
      avatar: 'E',
      streak: 45,
      studyGroups: 8,
      helpfulAnswers: 156,
      resourcesShared: 89
    },
    {
      id: '2',
      name: 'Alex Rivera',
      reputation: 1890,
      badge: 'Mentor',
      avatar: 'A',
      streak: 32,
      studyGroups: 6,
      helpfulAnswers: 134,
      resourcesShared: 67
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      reputation: 1650,
      badge: 'Contributor',
      avatar: 'S',
      streak: 28,
      studyGroups: 5,
      helpfulAnswers: 98,
      resourcesShared: 45
    },
    {
      id: user?.id || '4',
      name: user?.name || 'You',
      reputation: user?.reputation || 150,
      badge: user?.badge || 'Helper',
      avatar: user?.name?.charAt(0) || 'Y',
      streak: 7,
      studyGroups: 3,
      helpfulAnswers: 12,
      resourcesShared: 8
    },
    {
      id: '5',
      name: 'Mike Chen',
      reputation: 890,
      badge: 'Learner',
      avatar: 'M',
      streak: 15,
      studyGroups: 4,
      helpfulAnswers: 42,
      resourcesShared: 23
    }
  ].sort((a, b) => b.reputation - a.reputation);

  // Badge system
  const allBadges = [
    {
      id: 1,
      name: 'First Steps',
      description: 'Join your first study group',
      icon: '👣',
      category: 'milestone',
      points: 10,
      earned: true,
      earnedDate: '2 weeks ago'
    },
    {
      id: 2,
      name: 'Helper',
      description: 'Answer 10 questions',
      icon: '🤝',
      category: 'community',
      points: 50,
      earned: true,
      earnedDate: '1 week ago'
    },
    {
      id: 3,
      name: 'Contributor',
      description: 'Share 25 resources',
      icon: '📚',
      category: 'sharing',
      points: 100,
      earned: false,
      progress: 8,
      target: 25
    },
    {
      id: 4,
      name: 'Streak Master',
      description: '30-day study streak',
      icon: '🔥',
      category: 'consistency',
      points: 200,
      earned: false,
      progress: 7,
      target: 30
    },
    {
      id: 5,
      name: 'Mentor',
      description: 'Lead 5 study sessions',
      icon: '👨‍🏫',
      category: 'leadership',
      points: 250,
      earned: false,
      progress: 0,
      target: 5
    },
    {
      id: 6,
      name: 'Expert',
      description: 'Reach 1000 reputation points',
      icon: '⭐',
      category: 'expertise',
      points: 500,
      earned: false,
      progress: user?.reputation || 150,
      target: 1000
    },
    {
      id: 7,
      name: 'Social Butterfly',
      description: 'Join 10 study groups',
      icon: '🦋',
      category: 'social',
      points: 150,
      earned: false,
      progress: 3,
      target: 10
    },
    {
      id: 8,
      name: 'Knowledge Sharer',
      description: 'Upload 100 resources',
      icon: '📖',
      category: 'sharing',
      points: 300,
      earned: false,
      progress: 8,
      target: 100
    }
  ];

  const earnedBadges = allBadges.filter(badge => badge.earned);
  const availableBadges = allBadges.filter(badge => !badge.earned);

  // Weekly challenges
  const weeklyCharlenges = [
    {
      id: 1,
      title: 'Study Streak Champion',
      description: 'Maintain your study streak for 7 consecutive days',
      progress: 7,
      target: 7,
      reward: 100,
      deadline: '3 days left',
      completed: true
    },
    {
      id: 2,
      title: 'Question Master',
      description: 'Answer 15 questions this week',
      progress: 8,
      target: 15,
      reward: 75,
      deadline: '3 days left',
      completed: false
    },
    {
      id: 3,
      title: 'Resource Hero',
      description: 'Share 5 study materials',
      progress: 2,
      target: 5,
      reward: 50,
      deadline: '3 days left',
      completed: false
    },
    {
      id: 4,
      title: 'Social Learner',
      description: 'Join 2 new study groups',
      progress: 0,
      target: 2,
      reward: 60,
      deadline: '3 days left',
      completed: false
    }
  ];

  const userRank = leaderboard.findIndex(u => u.id === user?.id) + 1;

  const BadgeCard = ({ badge }) => (
    <div className={`bg-white rounded-xl p-6 border-2 transition-all duration-200 ${
      badge.earned 
        ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' 
        : 'border-gray-200 hover:border-primary-200'
    }`}>
      <div className="text-center">
        <div className={`text-4xl mb-3 ${badge.earned ? '' : 'grayscale opacity-50'}`}>
          {badge.icon}
        </div>
        <h3 className={`font-semibold mb-2 ${badge.earned ? 'text-yellow-800' : 'text-gray-900'}`}>
          {badge.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
        
        {badge.earned ? (
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mb-2">
              ✓ Earned {badge.earnedDate}
            </span>
            <p className="text-xs text-yellow-700">+{badge.points} points</p>
          </div>
        ) : (
          <div>
            {badge.progress !== undefined && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{badge.progress}/{badge.target}</span>
                  <span>{Math.round((badge.progress / badge.target) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                    style={{ width: `${Math.min((badge.progress / badge.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">Reward: {badge.points} points</p>
          </div>
        )}
      </div>
    </div>
  );

  const ChallengeCard = ({ challenge }) => (
    <div className={`bg-white rounded-xl p-6 border transition-all duration-200 ${
      challenge.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{challenge.title}</h3>
          <p className="text-sm text-gray-600">{challenge.description}</p>
        </div>
        {challenge.completed && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Completed
            </span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {challenge.progress}/{challenge.target}</span>
          <span className="text-primary-600 font-medium">+{challenge.reward} pts</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${challenge.completed ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-secondary-500'}`}
            style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{challenge.deadline}</span>
        {!challenge.completed && (
          <button className="text-primary-600 hover:text-primary-700 font-medium">
            View Details
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎮 Gamification Hub</h1>
          <p className="text-gray-600">Track your progress, earn badges, and compete with friends!</p>
        </div>

        {/* User Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <div className="text-2xl font-bold">{user?.reputation || 150}</div>
            <div className="text-sm opacity-90">Reputation Points</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="text-2xl font-bold">#{userRank}</div>
            <div className="text-sm opacity-90">Global Rank</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="text-2xl font-bold">{earnedBadges.length}</div>
            <div className="text-sm opacity-90">Badges Earned</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="text-2xl font-bold">7</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'badges', label: 'Badges' },
              { id: 'leaderboard', label: 'Leaderboard' },
              { id: 'challenges', label: 'Challenges' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Badges</h2>
              <div className="space-y-4">
                {earnedBadges.slice(0, 3).map((badge) => (
                  <div key={badge.id} className="flex items-center space-x-4">
                    <div className="text-2xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-500">Earned {badge.earnedDate}</p>
                    </div>
                    <div className="text-sm font-medium text-yellow-600">+{badge.points} pts</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress to Next Badge */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Badge</h2>
              <div className="space-y-4">
                {availableBadges.slice(0, 3).map((badge) => (
                  <div key={badge.id} className="flex items-center space-x-4">
                    <div className="text-2xl grayscale opacity-50">{badge.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{badge.name}</h3>
                      {badge.progress !== undefined ? (
                        <div className="mt-1">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{badge.progress}/{badge.target}</span>
                            <span>{Math.round((badge.progress / badge.target) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-primary-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min((badge.progress / badge.target) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">{badge.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Earned Badges ({earnedBadges.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {earnedBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Available Badges ({availableBadges.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {availableBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Global Leaderboard</h2>
            <div className="space-y-4">
              {leaderboard.map((user, index) => (
                <div key={user.id} className={`flex items-center p-4 rounded-lg ${
                  user.id === (user?.id || '4') ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-600' : 
                      index === 1 ? 'text-gray-400' : 
                      index === 2 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.badge}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600">{user.reputation} pts</div>
                      <div className="text-sm text-gray-500">{user.streak} day streak</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {weeklyCharlenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gamification;
