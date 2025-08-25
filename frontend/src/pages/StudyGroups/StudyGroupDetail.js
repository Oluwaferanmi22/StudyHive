import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import StudyGroupChat from '../../components/Chat/StudyGroupChat';

const StudyGroupDetail = () => {
  const { groupId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock study group data
  const studyGroup = {
    id: groupId,
    name: 'Mathematics 101',
    subject: 'Mathematics',
    description: 'Collaborative study group for foundational mathematics concepts including algebra, geometry, and basic calculus. We meet twice a week for group study sessions and maintain an active chat for daily discussions.',
    members: 12,
    maxMembers: 20,
    level: 'Beginner',
    isPublic: true,
    tags: ['Algebra', 'Geometry', 'Calculus'],
    creator: 'Sarah Johnson',
    created: '2 weeks ago',
    color: 'from-blue-500 to-blue-600',
    schedule: 'Tuesdays & Thursdays, 7:00 PM EST',
    nextSession: 'Tuesday, March 15, 2024 at 7:00 PM EST'
  };

  const members = [
    { id: '1', name: 'Sarah Johnson', role: 'Creator', reputation: 890, avatar: 'S', online: true },
    { id: '2', name: 'Mike Chen', role: 'Moderator', reputation: 650, avatar: 'M', online: true },
    { id: '3', name: 'Alex Rivera', role: 'Member', reputation: 420, avatar: 'A', online: false },
    { id: '4', name: 'Emma Davis', role: 'Member', reputation: 380, avatar: 'E', online: true },
    { id: '5', name: 'You', role: 'Member', reputation: 150, avatar: 'Y', online: true }
  ];

  const resources = [
    {
      id: 1,
      title: 'Linear Algebra Fundamentals',
      type: 'PDF',
      uploadedBy: 'Sarah Johnson',
      uploadedAt: '2 days ago',
      downloads: 15,
      rating: 4.8
    },
    {
      id: 2,
      title: 'Calculus Practice Problems',
      type: 'Document',
      uploadedBy: 'Mike Chen',
      uploadedAt: '1 week ago',
      downloads: 23,
      rating: 4.6
    },
    {
      id: 3,
      title: 'Geometry Video Explanation',
      type: 'Video Link',
      uploadedBy: 'Alex Rivera',
      uploadedAt: '3 days ago',
      downloads: 8,
      rating: 4.9
    }
  ];

  const upcomingSessions = [
    {
      id: 1,
      title: 'Chapter 5: Advanced Algebra',
      date: 'Tuesday, March 15, 2024',
      time: '7:00 PM - 9:00 PM EST',
      host: 'Sarah Johnson',
      attendees: 8
    },
    {
      id: 2,
      title: 'Problem Solving Workshop',
      date: 'Thursday, March 17, 2024',
      time: '7:00 PM - 8:30 PM EST',
      host: 'Mike Chen',
      attendees: 6
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className={`h-32 bg-gradient-to-r ${studyGroup.color} rounded-t-xl`}></div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${studyGroup.color} flex items-center justify-center text-white text-xl font-bold -mt-8 border-4 border-white shadow-lg`}>
                  {studyGroup.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{studyGroup.name}</h1>
                  <p className="text-gray-600">{studyGroup.subject} • {studyGroup.level}</p>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                    <span>{studyGroup.members}/{studyGroup.maxMembers} members</span>
                    <span>•</span>
                    <span>Created {studyGroup.created}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      {members.filter(m => m.online).length} online
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
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
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'chat', label: 'Chat', badge: '3' },
              { id: 'resources', label: 'Resources' },
              { id: 'members', label: 'Members' },
              { id: 'sessions', label: 'Sessions' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Group</h2>
                  <p className="text-gray-700 mb-4">{studyGroup.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {studyGroup.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
                      <p className="text-sm text-gray-600">{studyGroup.schedule}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Next Session</h3>
                      <p className="text-sm text-gray-600">{studyGroup.nextSession}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">S</div>
                      <div>
                        <p className="text-sm text-gray-900">Sarah Johnson shared a new resource: "Linear Algebra Fundamentals"</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">M</div>
                      <div>
                        <p className="text-sm text-gray-900">Mike Chen scheduled a new study session for Thursday</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">A</div>
                      <div>
                        <p className="text-sm text-gray-900">Alex Rivera joined the study group</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-[600px]">
                <StudyGroupChat groupId={studyGroup.id} groupName={studyGroup.name} />
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Shared Resources</h2>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Upload Resource
                  </button>
                </div>
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          {resource.type === 'PDF' && '📄'}
                          {resource.type === 'Document' && '📝'}
                          {resource.type === 'Video Link' && '🎥'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{resource.title}</h3>
                          <p className="text-sm text-gray-600">
                            {resource.type} • Uploaded by {resource.uploadedBy} • {resource.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          ⭐ {resource.rating} • {resource.downloads} downloads
                        </div>
                        <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Members ({members.length})</h2>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.avatar}
                          </div>
                          {member.online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.role} • {member.reputation} reputation</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Schedule Session
                  </button>
                </div>
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{session.title}</h3>
                        <span className="text-sm text-primary-600">{session.attendees} attending</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📅 {session.date}</p>
                        <p>⏰ {session.time}</p>
                        <p>👨‍🏫 Hosted by {session.host}</p>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <button className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                          Join Session
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Group Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Members</span>
                  <span className="text-sm font-medium text-gray-900">{studyGroup.members}/{studyGroup.maxMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Online Now</span>
                  <span className="text-sm font-medium text-green-600">{members.filter(m => m.online).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Resources Shared</span>
                  <span className="text-sm font-medium text-gray-900">{resources.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Study Sessions</span>
                  <span className="text-sm font-medium text-gray-900">{upcomingSessions.length}</span>
                </div>
              </div>
            </div>

            {/* Online Members */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Online Members</h3>
              <div className="space-y-3">
                {members.filter(member => member.online).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupDetail;
