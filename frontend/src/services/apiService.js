import api from '../api';

// Authentication API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (login, password) => {
    const response = await api.post('/auth/login', { login, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/auth/stats');
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  list: async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
    const response = await api.get('/notifications', { params: { page, limit, unreadOnly } });
    return response.data;
  },
  markRead: async (id) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },
  clearAll: async () => {
    const response = await api.delete('/notifications/clear');
    return response.data;
  }
};

// AI Tutor API
export const aiAPI = {
  ask: async ({ question, subject = 'general' }) => {
    try {
      const response = await api.post('/ai/ask', { question, subject });
      return response.data;
    } catch (error) {
      const status = error?.response?.status || 0;
      const message = error?.response?.data?.message || 'Request failed';
      return { success: false, message, status };
    }
  },
};

// Study Hives API
export const hivesAPI = {
  getHives: async (params = {}) => {
    const response = await api.get('/hives', { params });
    return response.data;
  },

  getHive: async (hiveId) => {
    const response = await api.get(`/hives/${hiveId}`);
    return response.data;
  },

  createHive: async (hiveData) => {
    const response = await api.post('/hives', hiveData);
    return response.data;
  },

  updateHive: async (hiveId, hiveData) => {
    const response = await api.put(`/hives/${hiveId}`, hiveData);
    return response.data;
  },

  deleteHive: async (hiveId) => {
    const response = await api.delete(`/hives/${hiveId}`);
    return response.data;
  },

  joinHive: async (hiveId, message = '') => {
    const response = await api.post(`/hives/${hiveId}/join`, { message });
    return response.data;
  },

  leaveHive: async (hiveId) => {
    const response = await api.post(`/hives/${hiveId}/leave`);
    return response.data;
  },

  getMyHives: async () => {
    const response = await api.get('/hives/my-hives');
    return response.data;
  },

  getHiveMembers: async (hiveId, params = {}) => {
    const response = await api.get(`/hives/${hiveId}/members`, { params });
    return response.data;
  },

  updateMemberRole: async (hiveId, memberId, role) => {
    const response = await api.put(`/hives/${hiveId}/members/${memberId}`, { role });
    return response.data;
  },

  removeMember: async (hiveId, memberId) => {
    const response = await api.delete(`/hives/${hiveId}/members/${memberId}`);
    return response.data;
  },

  getHiveStats: async (hiveId) => {
    const response = await api.get(`/hives/${hiveId}/stats`);
    return response.data;
  },

  createAnnouncement: async (hiveId, announcementData) => {
    const response = await api.post(`/hives/${hiveId}/announcements`, announcementData);
    return response.data;
  },

  getJoinRequests: async (hiveId, status = 'pending') => {
    const response = await api.get(`/hives/${hiveId}/join-requests`, {
      params: { status }
    });
    return response.data;
  },

  manageJoinRequest: async (hiveId, requestId, action) => {
    const response = await api.post(`/hives/${hiveId}/join-requests/${requestId}`, {
      action
    });
    return response.data;
  },

  searchHives: async (params = {}) => {
    const response = await api.get('/hives/search', { params });
    return response.data;
  },

  generateShareableLink: async (hiveId) => {
    const response = await api.post(`/hives/${hiveId}/share-link`);
    return response.data;
  },

  updateShareableLinkSettings: async (hiveId, settings) => {
    const response = await api.put(`/hives/${hiveId}/share-link/settings`, settings);
    return response.data;
  },

  disableShareableLink: async (hiveId) => {
    const response = await api.delete(`/hives/${hiveId}/share-link`);
    return response.data;
  },

  joinHiveByLink: async (linkId, message = '') => {
    const response = await api.post(`/hives/join/${linkId}`, { message });
    return response.data;
  }
};

// Messages API
export const messagesAPI = {
  getMessages: async (hiveId, params = {}) => {
    const response = await api.get(`/messages/hive/${hiveId}`, { params });
    return response.data;
  },

  sendMessage: async (messageData) => {
    // Handle FormData for file uploads
    if (messageData instanceof FormData) {
      const response = await api.post('/messages', messageData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }
    
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  editMessage: async (messageId, content) => {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  addReaction: async (messageId, emoji) => {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  togglePin: async (messageId) => {
    const response = await api.put(`/messages/${messageId}/pin`);
    return response.data;
  },

  voteOnPoll: async (messageId, optionIndex) => {
    const response = await api.post(`/messages/${messageId}/poll/vote`, { optionIndex });
    return response.data;
  },

  searchMessages: async (params = {}) => {
    const response = await api.get('/messages/search', { params });
    return response.data;
  },

  getMessageThread: async (messageId) => {
    const response = await api.get(`/messages/${messageId}/thread`);
    return response.data;
  },

  getPinnedMessages: async (hiveId) => {
    const response = await api.get(`/messages/hive/${hiveId}/pinned`);
    return response.data;
  },

  getMessageStats: async (hiveId, period = '7d') => {
    const response = await api.get(`/messages/hive/${hiveId}/stats`, {
      params: { period }
    });
    return response.data;
  },

  uploadFiles: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getUnreadCount: async (hiveId = '') => {
    const response = await api.get('/messages/unread-count', {
      params: hiveId ? { hiveId } : {}
    });
    return response.data;
  },

  markMessagesAsRead: async (data) => {
    const response = await api.post('/messages/mark-read', data);
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
};

// Resources API
export const resourcesAPI = {
  list: async (hiveId) => {
    const response = await api.get('/resources', { params: { hiveId } });
    return response.data;
  },
  uploadPdf: async ({ hiveId, file, title, description, subject, tags = [] }) => {
    const formData = new FormData();
    formData.append('hiveId', hiveId);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (subject) formData.append('subject', subject);
    if (tags && tags.length) formData.append('tags', tags.join(','));
    formData.append('file', file);
    const response = await api.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

// Payment API
export const paymentsAPI = {
  // Initialize Paystack payment
  initializePayment: async (paymentData) => {
    const response = await api.post('/payments/initialize', paymentData);
    return response.data;
  },

  // Verify Paystack payment
  verifyPayment: async (reference) => {
    const response = await api.post('/payments/verify', { reference });
    return response.data;
  },

  // Get user usage statistics
  getUserUsage: async () => {
    const response = await api.get('/payments/usage');
    return response.data;
  },

  // Track AI tutor usage
  trackAITutorUsage: async () => {
    const response = await api.post('/payments/track-usage');
    return response.data;
  },

  // Get payments display configuration
  getConfig: async () => {
    const response = await api.get('/payments/config');
    return response.data;
  }
};

// Error handler utility
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: error.response.data?.message || 'Server error occurred',
      status: error.response.status,
      errors: error.response.data?.errors || []
    };
  } else if (error.request) {
    // Network error
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0
    };
  } else {
    // Other error
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 0
    };
  }
};
