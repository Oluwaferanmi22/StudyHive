import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
  }

  // Initialize socket connection
  connect(token) {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to StudyHive server');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from StudyHive server:', reason);
      this.connected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
      this.connected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection_error', { 
          message: 'Failed to connect to server. Please check your internet connection.' 
        });
      }
    });

    // Handle authentication errors
    this.socket.on('error', (error) => {
      console.error('🚨 Socket error:', error);
      if (error.message === 'Authentication failed') {
        this.emit('auth_error', { message: 'Authentication failed. Please log in again.' });
      }
    });

    // Message events
    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    this.socket.on('message_edited', (data) => {
      this.emit('message_edited', data);
    });

    this.socket.on('message_deleted', (data) => {
      this.emit('message_deleted', data);
    });

    this.socket.on('reaction_added', (data) => {
      this.emit('reaction_added', data);
    });

    this.socket.on('poll_vote_updated', (data) => {
      this.emit('poll_vote_updated', data);
    });

    // Typing indicators
    this.socket.on('user_typing_start', (data) => {
      this.emit('user_typing_start', data);
    });

    this.socket.on('user_typing_stop', (data) => {
      this.emit('user_typing_stop', data);
    });

    // Hive events
    this.socket.on('hive_joined', (data) => {
      this.emit('hive_joined', data);
    });

    this.socket.on('hive_left', (data) => {
      this.emit('hive_left', data);
    });

    this.socket.on('user_joined_hive', (data) => {
      this.emit('user_joined_hive', data);
    });

    this.socket.on('user_left_hive', (data) => {
      this.emit('user_left_hive', data);
    });

    // User status
    this.socket.on('user_status_update', (data) => {
      this.emit('user_status_update', data);
    });

    // Notifications
    this.socket.on('mention_notification', (data) => {
      this.emit('mention_notification', data);
    });

    // Message reading
    this.socket.on('messages_read', (data) => {
      this.emit('messages_read', data);
    });

    // Success confirmations
    this.socket.on('message_sent', (data) => {
      this.emit('message_sent', data);
    });

    this.socket.on('message_edit_success', (data) => {
      this.emit('message_edit_success', data);
    });

    this.socket.on('message_delete_success', (data) => {
      this.emit('message_delete_success', data);
    });

    this.socket.on('messages_marked_read', (data) => {
      this.emit('messages_marked_read', data);
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Check if connected
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit events to registered listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Hive management
  joinHive(hiveId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_hive', { hiveId });
    }
  }

  leaveHive(hiveId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_hive', { hiveId });
    }
  }

  // Message management
  sendMessage(messageData) {
    if (this.socket && this.connected) {
      this.socket.emit('send_message', messageData);
    }
  }

  editMessage(messageId, content) {
    if (this.socket && this.connected) {
      this.socket.emit('edit_message', { messageId, content });
    }
  }

  deleteMessage(messageId) {
    if (this.socket && this.connected) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  addReaction(messageId, emoji) {
    if (this.socket && this.connected) {
      this.socket.emit('add_reaction', { messageId, emoji });
    }
  }

  removeReaction(messageId, emoji) {
    if (this.socket && this.connected) {
      this.socket.emit('remove_reaction', { messageId, emoji });
    }
  }

  voteOnPoll(messageId, optionIndex) {
    if (this.socket && this.connected) {
      this.socket.emit('poll_vote', { messageId, optionIndex });
    }
  }

  // Typing indicators
  startTyping(hiveId) {
    if (this.socket && this.connected) {
      this.socket.emit('typing_start', { hiveId });
    }
  }

  stopTyping(hiveId) {
    if (this.socket && this.connected) {
      this.socket.emit('typing_stop', { hiveId });
    }
  }

  // User status
  updateStatus(status) {
    if (this.socket && this.connected) {
      this.socket.emit('update_status', { status });
    }
  }

  // Mark messages as read
  markMessagesAsRead(data) {
    if (this.socket && this.connected) {
      this.socket.emit('mark_messages_read', data);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.connected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Reconnect manually
  reconnect(token) {
    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 1000);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
