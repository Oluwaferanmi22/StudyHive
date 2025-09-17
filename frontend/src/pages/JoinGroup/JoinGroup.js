import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hivesAPI } from '../../services/apiService';

const JoinGroup = () => {
  const { linkId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?returnTo=/join/${linkId}`);
      return;
    }

    // Fetch group info by link
    const fetchGroupInfo = async () => {
      try {
        setIsLoading(true);
        // This would be a new API endpoint to get group info by shareable link
        // For now, we'll simulate it
        setGroupInfo({
          name: 'Sample Study Group',
          description: 'A collaborative study group for learning together.',
          subject: 'Mathematics',
          memberCount: 15,
          maxMembers: 50,
          requiresApproval: true
        });
      } catch (error) {
        setError('Invalid or expired shareable link');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupInfo();
  }, [linkId, isAuthenticated, navigate]);

  const handleJoinGroup = async () => {
    try {
      setIsJoining(true);
      const res = await hivesAPI.joinHiveByLink(linkId, message);
      
      if (res.success) {
        if (res.data.status === 'joined') {
          // Redirect to the group
          navigate(`/study-groups/${res.data.hive.id}`);
        } else {
          // Show success message for pending approval
          alert('Join request submitted successfully. Please wait for approval.');
          navigate('/study-groups');
        }
      } else {
        setError(res.message || 'Failed to join group');
      }
    } catch (error) {
      setError('Failed to join group. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading group information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/study-groups')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Browse Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐝</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Join Study Group
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You've been invited to join a study group
            </p>
          </div>

          {groupInfo && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {groupInfo.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {groupInfo.description}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>📚 {groupInfo.subject}</span>
                <span>👥 {groupInfo.memberCount}/{groupInfo.maxMembers} members</span>
                {groupInfo.requiresApproval && (
                  <span className="text-yellow-600">⚠️ Requires approval</span>
                )}
              </div>
            </div>
          )}

          {groupInfo?.requiresApproval && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Why do you want to join this group? (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="3"
                placeholder="Tell us about your interest in this group..."
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/study-groups')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinGroup}
              disabled={isJoining}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;
