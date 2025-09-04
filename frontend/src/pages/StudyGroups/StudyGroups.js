import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AIMatchingQuiz from '../../components/StudyGroups/AIMatchingQuiz';
import { SkeletonCard, ButtonLoader, InlineLoader } from '../../components/Common/Loaders';
import { useAuth } from '../../contexts/AuthContext';
import { hivesAPI } from '../../services/apiService';

const StudyGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [isJoining, setIsJoining] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  
  // Form state for creating hive
  const [hiveForm, setHiveForm] = useState({
    name: '',
    subject: '',
    description: '',
    level: 'Beginner',
    maxMembers: 15,
    isPublic: true
  });

  const [myGroups, setMyGroups] = useState([]);

  useEffect(() => {
    loadAllGroups();
    if (user) {
      loadMyGroups();
    }
  }, [user]);

  // Load all public groups
  const loadAllGroups = async () => {
    try {
      setIsLoading(true);
      const result = await hivesAPI.getHives();
      if (result.success) {
        setGroups(result.data || []);
      } else {
        console.error('Failed to load groups:', result.message);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's groups
  const loadMyGroups = async () => {
    try {
      const result = await hivesAPI.getMyHives();
      if (result.success) {
        setMyGroups(result.data || []);
      }
    } catch (error) {
      console.error('Error loading my groups:', error);
    }
  };

  // Handle joining a group
  const handleJoinHive = async (hiveId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsJoining(prev => ({ ...prev, [hiveId]: true }));
      const result = await hivesAPI.joinHive(hiveId);
      
      if (result.success) {
        // Refresh both lists
        await loadAllGroups();
        await loadMyGroups();
        // Navigate to the hive
        navigate(`/study-groups/${hiveId}`);
      } else {
        alert(result.message || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining hive:', error);
      alert(error.response?.data?.message || 'An error occurred while joining the group');
    } finally {
      setIsJoining(prev => ({ ...prev, [hiveId]: false }));
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAIRecommendations = (recommendations) => {
    setAiRecommendations(recommendations);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHiveForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleCreateHive = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setCreateError('You must be logged in to create a group');
      return;
    }

    if (!hiveForm.name.trim()) {
      setCreateError('Group name is required');
      return;
    }

    if (!hiveForm.subject || hiveForm.subject === 'Select a subject') {
      setCreateError('Please select a subject');
      return;
    }

    if (!hiveForm.description.trim()) {
      setCreateError('Description is required');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      // Prepare hive data
      const hiveData = {
        name: hiveForm.name.trim(),
        description: hiveForm.description.trim(),
        subject: hiveForm.subject,
        tags: [], // You could parse tags from description or add a tags field
        settings: {
          isPrivate: !hiveForm.isPublic,
          requireApproval: false,
          maxMembers: parseInt(hiveForm.maxMembers)
        }
      };

      console.log('Creating hive with data:', hiveData);
      
      const result = await hivesAPI.createHive(hiveData);
      
      if (result.success) {
        // Reset form
        setHiveForm({
          name: '',
          subject: '',
          description: '',
          level: 'Beginner',
          maxMembers: 15,
          isPublic: true
        });
        
        // Redirect to the new hive
        navigate(`/study-groups/${result.data._id}`);
      } else {
        setCreateError(result.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating hive:', error);
      setCreateError(error.response?.data?.message || 'An error occurred while creating the group');
    } finally {
      setIsCreating(false);
    }
  };

  const RecommendationCard = ({ recommendation }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{recommendation.groupName}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {recommendation.match} match
              </span>
            </div>
            <p className="text-sm text-gray-600">{recommendation.subject} • {recommendation.level}</p>
          </div>
        </div>
        
        <p className="text-gray-700 text-sm mb-4">{recommendation.reason}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{recommendation.members} members</span>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
              💬 Preview
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors">
              Join Hive
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to get a consistent color for each group
  const getGroupColor = (name) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600'
    ];
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper function to check if user is already a member
  const isUserMember = (group) => {
    return user && group.members && group.members.some(member => 
      member.userId === user.id || member.userId._id === user.id
    );
  };

  const GroupCard = ({ group }) => {
    const isMember = isUserMember(group);
    const memberCount = group.memberCount || (group.members ? group.members.length : 0);
    const maxMembers = group.settings?.maxMembers || 50;
    const isPrivate = group.settings?.isPrivate || false;
    const creatorName = group.creator?.profile?.firstName + ' ' + group.creator?.profile?.lastName || 
                       group.creator?.username || 'Unknown';
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getGroupColor(group.name)} flex items-center justify-center text-white font-semibold`}>
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.subject}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isMember && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Joined
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {!isPrivate ? 'Public' : 'Private'}
              </span>
            </div>
          </div>

          <p className="mt-4 text-gray-700 text-sm leading-relaxed">{group.description}</p>

          {group.tags && group.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {group.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM5 10a7 7 0 1110 0v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4z" />
                </svg>
                {memberCount}/{maxMembers} members
              </span>
              <span>Created by {creatorName}</span>
            </div>
            <div className="flex space-x-3">
              {isMember ? (
                <Link
                  to={`/study-groups/${group._id}`}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-colors"
                >
                  💬 Open Chat
                </Link>
              ) : (
                <>
                  <Link
                    to={`/study-groups/${group._id}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    👁️ Preview
                  </Link>
                  <button 
                    onClick={() => handleJoinHive(group._id)}
                    disabled={isJoining[group._id] || memberCount >= maxMembers}
                    className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-sm font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isJoining[group._id] ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : memberCount >= maxMembers ? (
                      'Full'
                    ) : (
                      '🐝 Join Hive'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
          <p className="mt-2 text-gray-600">Discover and join collaborative learning communities.</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse All Groups
            </button>
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-groups'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Groups
            </button>
            <button
              onClick={() => setActiveTab('ai-match')}
              className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'ai-match'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🤖 AI Match
              <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                ✨
              </span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Group
            </button>
          </nav>
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Search and Filters */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search groups by name, subject, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                  <option>All Subjects</option>
                  <option>Mathematics</option>
                  <option>Biology</option>
                  <option>Computer Science</option>
                  <option>Physics</option>
                  <option>History</option>
                </select>
                <select className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                  <option>All Levels</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {isLoading ? (
                // Show loading skeletons while groups are loading
                <>                  
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                filteredGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))
              )}
            </div>

            {!isLoading && filteredGroups.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or create a new group.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'my-groups' && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">🐝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Study Groups</h3>
            <p className="text-gray-600 mb-6">You'll see all your joined groups here.</p>
            <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-colors">
              Browse Groups to Join
            </button>
          </div>
        )}

        {activeTab === 'ai-match' && (
          <div>
            {!aiRecommendations ? (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Group Matching</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Answer a few questions about your learning preferences, goals, and strengths. 
                    Our AI will analyze your responses and recommend the perfect study groups for you!
                  </p>
                </div>
                <AIMatchingQuiz onComplete={handleAIRecommendations} />
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                  <div className="text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Your AI Recommendations</h3>
                    <p className="text-gray-600 mb-6">
                      Based on your preferences, we've found these perfect study groups for you!
                    </p>
                    <button 
                      onClick={() => setAiRecommendations(null)}
                      className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      🔄 Retake Quiz
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {aiRecommendations.map((recommendation, index) => (
                    <RecommendationCard key={index} recommendation={recommendation} />
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-600 mb-4">Don't see what you're looking for?</p>
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={() => setActiveTab('browse')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Browse All Groups
                    </button>
                    <button 
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-colors"
                    >
                      Create Your Own
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Create New Study Group</h3>
            
            {createError && (
              <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateHive} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={hiveForm.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select 
                  name="subject"
                  value={hiveForm.subject}
                  onChange={handleFormChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Physics">Physics</option>
                  <option value="History">History</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={hiveForm.description}
                  onChange={handleFormChange}
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe your study group's goals and focus areas"
                  required
                />
              </div>
              <div className="flex gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select 
                    name="level"
                    value={hiveForm.level}
                    onChange={handleFormChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Members</label>
                  <input
                    type="number"
                    name="maxMembers"
                    value={hiveForm.maxMembers}
                    onChange={handleFormChange}
                    min="2"
                    max="50"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    name="isPublic"
                    checked={hiveForm.isPublic}
                    onChange={handleFormChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Make this group public</span>
                </label>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Study Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroups;
