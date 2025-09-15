import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StudyGroupChat from '../../components/Chat/StudyGroupChat';
import VideoCall from '../../components/Video/VideoCall';
import { resourcesAPI, hivesAPI } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const StudyGroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareableLink, setShareableLink] = useState(null);
  const [linkSettings, setLinkSettings] = useState({
    requiresApproval: true,
    expiresAt: '',
    maxUses: ''
  });

  // Basic group scaffold (can be loaded from backend later)
  const studyGroup = {
    id: groupId,
    name: 'Study Group',
    subject: 'General',
    description: 'Collaborative study group.',
    members: 0,
    maxMembers: 0,
    level: 'All levels',
    isPublic: true,
    tags: [],
    created: '',
    color: 'from-primary-500 to-secondary-500',
    schedule: '',
    nextSession: ''
  };

  const [resources, setResources] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await resourcesAPI.list(groupId);
        if (res.success) setResources(res.data);
      } catch (e) {
        // ignore
      }
    };
    if (groupId) fetchResources();
  }, [groupId]);

  // Check if user is creator
  useEffect(() => {
    // This would be determined by the actual group data from backend
    // For now, we'll assume the user is the creator if they're logged in
    setIsCreator(!!user);
  }, [user]);

  const generateShareableLink = async () => {
    try {
      const res = await hivesAPI.generateShareableLink(groupId);
      if (res.success) {
        setShareableLink(res.data);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Error generating shareable link:', error);
    }
  };

  const updateLinkSettings = async () => {
    try {
      const res = await hivesAPI.updateShareableLinkSettings(groupId, linkSettings);
      if (res.success) {
        setLinkSettings(res.data.settings);
      }
    } catch (error) {
      console.error('Error updating link settings:', error);
    }
  };

  const disableShareableLink = async () => {
    try {
      const res = await hivesAPI.disableShareableLink(groupId);
      if (res.success) {
        setShareableLink(null);
        setShowShareModal(false);
      }
    } catch (error) {
      console.error('Error disabling shareable link:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleUploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const res = await resourcesAPI.uploadPdf({ hiveId: groupId, file });
      if (res.success) {
        setResources(prev => [res.data, ...prev]);
      } else {
        setError(res.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
          <div className={`h-32 bg-gradient-to-r ${studyGroup.color} rounded-t-xl`}></div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${studyGroup.color} flex items-center justify-center text-white text-xl font-bold -mt-8 border-4 border-white dark:border-gray-800 shadow-lg`}>
                  {studyGroup.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{studyGroup.name}</h1>
                  <p className="text-gray-600 dark:text-gray-300">{studyGroup.subject} • {studyGroup.level}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Share Group
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-colors">
                  Join Study Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'chat', label: 'Chat' },
              { id: 'video', label: 'Video' },
              { id: 'resources', label: 'Resources' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">About This Group</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{studyGroup.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {studyGroup.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Shareable Link Section - Only for creators */}
                {isCreator && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Share Group</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Generate a shareable link to invite others to join this group.
                    </p>
                    
                    {!shareableLink ? (
                      <button
                        onClick={generateShareableLink}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Generate Shareable Link
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={shareableLink.fullUrl}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                          <button
                            onClick={() => copyToClipboard(shareableLink.fullUrl)}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={updateLinkSettings}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Settings
                          </button>
                          <button
                            onClick={disableShareableLink}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Disable Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-[600px]">
                <StudyGroupChat groupId={studyGroup.id} groupName={studyGroup.name} />
              </div>
            )}

            {activeTab === 'video' && (
              <div className="h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2">
                <VideoCall roomName={`hive-${studyGroup.id}`} displayName={"Guest"} />
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Shared Resources</h2>
                  <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                    {isUploading ? 'Uploading…' : 'Upload PDF'}
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadPdf} disabled={isUploading} />
                  </label>
                </div>
                {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center">📄</div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{resource.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            PDF • Uploaded by {resource.author?.profile?.firstName || resource.author?.username || 'User'} • {new Date(resource.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <a
                          href={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/${resource.content?.file?.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                        >
                          View / Download
                        </a>
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-300">No resources yet. Upload a PDF to get started.</div>
                  )}
                </div>
              </div>
            )}

            {/* Members and Sessions tabs removed (no demo data) */}
          </div>

          {/* Sidebar removed demo widgets */}
          <div className="space-y-6"></div>
        </div>
      </div>

      {/* Shareable Link Settings Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Link Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={linkSettings.requiresApproval}
                    onChange={(e) => setLinkSettings(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Require approval for new members</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiration Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={linkSettings.expiresAt}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maximum Uses (optional)
                </label>
                <input
                  type="number"
                  value={linkSettings.maxUses}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, maxUses: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateLinkSettings();
                  setShowShareModal(false);
                }}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroupDetail;
