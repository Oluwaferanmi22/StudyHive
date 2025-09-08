import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
    institution: user?.profile?.institution || '',
    studyYear: user?.profile?.studyYear || 'Other',
    major: user?.profile?.major || '',
    studySubjects: (user?.preferences?.studySubjects || []).join(', '),
    studyGoals: (user?.preferences?.studyGoals || []).join(', '),
    availabilityHours: user?.preferences?.availabilityHours || 'Flexible',
    preferredGroupSize: user?.preferences?.preferredGroupSize || 'Any'
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const { updateProfile } = useAuth();

  useEffect(() => {
    // Sync when user changes
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
      institution: user?.profile?.institution || '',
      studyYear: user?.profile?.studyYear || 'Other',
      major: user?.profile?.major || '',
      studySubjects: (user?.preferences?.studySubjects || []).join(', '),
      studyGoals: (user?.preferences?.studyGoals || []).join(', '),
      availabilityHours: user?.preferences?.availabilityHours || 'Flexible',
      preferredGroupSize: user?.preferences?.preferredGroupSize || 'Any'
    });
  }, [user]);

  const handleSave = async () => {
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      bio: formData.bio,
      institution: formData.institution,
      studyYear: formData.studyYear,
      major: formData.major,
      studySubjects: formData.studySubjects
        ? formData.studySubjects.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      studyGoals: formData.studyGoals
        ? formData.studyGoals.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      availabilityHours: formData.availabilityHours,
      preferredGroupSize: formData.preferredGroupSize
    };
    const res = await updateProfile(payload);
    if (res?.success) setIsEditing(false);
  };

  // Removed demo badges, activity, and stats

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-8">
          <div className="relative h-32 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-t-xl"></div>
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
              <div className="-mt-16 relative">
                {user?.profile?.avatar ? (
                  <img src={`/${user.profile.avatar}`} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg" />
                ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-600 to-secondary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {user?.username?.charAt(0) || 'U'}
                </div>
                )}
                <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-2 cursor-pointer shadow">
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const form = new FormData();
                    form.append('avatar', file);
                    const res = await fetch((process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/users/avatar', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${localStorage.getItem('studyhive_token') || ''}` },
                      body: form
                    });
                    const data = await res.json();
                    if (data?.success) {
                      window.location.reload();
                    }
                    e.target.value = '';
                  }} />
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L13 1.586A2 2 0 0011.586 1H4zm6 3a5 5 0 110 10 5 5 0 010-10z"/></svg>
                </label>
              </div>
              <div className="mt-4 sm:mt-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.username}</h1>
                    <p className="text-gray-600 dark:text-gray-300">{formData.major}{formData.institution ? ` at ${formData.institution}` : ''}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      {user?.gamification && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Level {user.gamification.level} • {user.gamification.points} pts
                      </span>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-300">📍 {formData.location}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bio and Preferences */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">About</h2>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                        <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                    </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                        <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                </div>
              </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution</label>
                        <input name="institution" value={formData.institution} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Study Year</label>
                        <select name="studyYear" value={formData.studyYear} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                          {['Freshman','Sophomore','Junior','Senior','Graduate','Other'].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Major</label>
                      <input name="major" value={formData.major} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Study Subjects (comma-separated)</label>
                        <input name="studySubjects" value={formData.studySubjects} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Study Goals (comma-separated)</label>
                        <input name="studyGoals" value={formData.studyGoals} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Availability</label>
                        <select name="availabilityHours" value={formData.availabilityHours} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                          {['Morning','Afternoon','Evening','Night','Flexible'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Group Size</label>
                        <select name="preferredGroupSize" value={formData.preferredGroupSize} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                          {['Small (2-4)','Medium (5-8)','Large (9+)','Any'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Bio</h3>
                      <p className="text-gray-700 dark:text-gray-300">{formData.bio || 'No bio yet.'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Study Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {(formData.studySubjects ? formData.studySubjects.split(',') : []).map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Profile Settings</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">University</label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Major</label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notifications</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Email notifications for new messages</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Email notifications for study session reminders</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Weekly activity summary</span>
                  </label>
                </div>
              </div>

              <div className="pt-6">
                <button className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
