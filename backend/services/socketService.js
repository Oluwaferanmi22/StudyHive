const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudyHive = require('../models/StudyHive');
const Message = require('../models/Message');

class SocketService {
  constructor() {
    this.connectedUsers = new Map(); // userId -> { socketId, status, lastSeen }
    this.hiveMembers = new Map(); // hiveId -> Set of userIds
    this.typingUsers = new Map(); // hiveId -> Map of userId -> timeout
  }

  // Initialize Socket.IO
  initialize(io) {
    this.io = io;

    // Middleware for authentication
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected with socket ${socket.id}`);
      this.handleConnection(socket);
    });
  }

  // Handle new socket connection
  handleConnection(socket) {
    const userId = socket.userId;

    // Track connected user
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      status: 'online',
      lastSeen: new Date()
    });

    // Update user's last active time
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec();

    // Join user to their hive rooms
    this.joinUserHives(socket);

    // Set up event handlers
    this.setupEventHandlers(socket);

    // Notify user's hives about online status
    this.broadcastUserStatus(userId, 'online');
  }

  // Join user to all their hive rooms
  async joinUserHives(socket) {
    try {
      const user = await User.findById(socket.userId).populate('hives.hiveId');
      
      for (const hive of user.hives) {
        if (hive.hiveId && hive.hiveId.isActive) {
          const hiveId = hive.hiveId._id.toString();
          socket.join(`hive_${hiveId}`);
          
          // Track hive membership
          if (!this.hiveMembers.has(hiveId)) {
            this.hiveMembers.set(hiveId, new Set());
          }
          this.hiveMembers.get(hiveId).add(socket.userId);

          console.log(`User ${socket.user.username} joined hive room: ${hive.hiveId.name}`);
        }
      }
    } catch (error) {
      console.error('Error joining user hives:', error);
    }
  }

  // Set up all socket event handlers
  setupEventHandlers(socket) {
    // Message events
    socket.on('send_message', (data) => this.handleSendMessage(socket, data));
    socket.on('edit_message', (data) => this.handleEditMessage(socket, data));
    socket.on('delete_message', (data) => this.handleDeleteMessage(socket, data));
    socket.on('add_reaction', (data) => this.handleAddReaction(socket, data));
    socket.on('remove_reaction', (data) => this.handleRemoveReaction(socket, data));

    // Typing indicators
    socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));

    // Hive events
    socket.on('join_hive', (data) => this.handleJoinHive(socket, data));
    socket.on('leave_hive', (data) => this.handleLeaveHive(socket, data));

    // User status
    socket.on('update_status', (data) => this.handleUpdateStatus(socket, data));

    // Poll voting
    socket.on('poll_vote', (data) => this.handlePollVote(socket, data));

    // Message reading
    socket.on('mark_messages_read', (data) => this.handleMarkMessagesRead(socket, data));

    // Disconnect
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  // Handle sending messages
  async handleSendMessage(socket, data) {
    try {
      const { content, hiveId, messageType = 'text', replyTo, mentions = [], poll, codeLanguage } = data;

      // Validate hive membership
      const hive = await StudyHive.findById(hiveId);
      if (!hive || !hive.isMember(socket.userId)) {
        socket.emit('error', { message: 'You are not a member of this hive' });
        return;
      }

      // Create message data
      const messageData = {
        content,
        author: socket.userId,
        hive: hiveId,
        messageType,
        replyTo,
        mentions,
        codeLanguage
      };

      // Handle poll data
      if (messageType === 'poll' && poll) {
        messageData.poll = {
          question: poll.question,
          options: poll.options.map(option => ({
            text: option.text || option,
            votes: []
          })),
          allowMultiple: poll.allowMultiple || false,
          expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : null
        };
      }

      // Create message
      const message = await Message.create(messageData);

      // Update reply message if replying
      if (replyTo) {
        await Message.findByIdAndUpdate(replyTo, {
          $push: { replies: message._id }
        });
      }

      // Award points
      const user = await User.findById(socket.userId);
      user.addPoints(5, 'Sent Message');
      await user.save();

      // Populate message
      await message.populate([
        { path: 'author', select: 'username profile.firstName profile.lastName profile.avatar gamification.level' },
        { path: 'replyTo', select: 'content author createdAt' },
        { path: 'mentions', select: 'username profile.firstName profile.lastName' }
      ]);

      // Broadcast to hive room
      this.io.to(`hive_${hiveId}`).emit('new_message', {
        message,
        hiveId
      });

      // Send notification to mentioned users
      if (mentions.length > 0) {
        this.sendMentionNotifications(mentions, message);
      }

      // Confirm to sender
      socket.emit('message_sent', { success: true, message });

    } catch (error) {
      console.error('Error handling send message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Handle message editing
  async handleEditMessage(socket, data) {
    try {
      const { messageId, content } = data;

      const message = await Message.findById(messageId);
      if (!message || message.author.toString() !== socket.userId) {
        socket.emit('error', { message: 'You can only edit your own messages' });
        return;
      }

      // Check if message is too old (24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (message.createdAt < twentyFourHoursAgo) {
        socket.emit('error', { message: 'Messages can only be edited within 24 hours' });
        return;
      }

      message.editContent(content);
      await message.save();

      // Broadcast edit to hive room
      this.io.to(`hive_${message.hive}`).emit('message_edited', {
        messageId,
        content,
        isEdited: true,
        editedAt: new Date()
      });

      socket.emit('message_edit_success', { messageId });
    } catch (error) {
      console.error('Error handling edit message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  }

  // Handle message deletion
  async handleDeleteMessage(socket, data) {
    try {
      const { messageId } = data;

      const message = await Message.findById(messageId);
      if (!message || message.isDeleted) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check permissions
      const hive = await StudyHive.findById(message.hive);
      const isAuthor = message.author.toString() === socket.userId;
      const canModerate = hive && hive.canModerate(socket.userId);

      if (!isAuthor && !canModerate) {
        socket.emit('error', { message: 'You do not have permission to delete this message' });
        return;
      }

      message.softDelete(socket.userId);
      await message.save();

      // Broadcast deletion to hive room
      this.io.to(`hive_${message.hive}`).emit('message_deleted', {
        messageId,
        deletedBy: socket.userId
      });

      socket.emit('message_delete_success', { messageId });
    } catch (error) {
      console.error('Error handling delete message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  }

  // Handle adding reactions
  async handleAddReaction(socket, data) {
    try {
      const { messageId, emoji } = data;

      const message = await Message.findById(messageId);
      if (!message || message.isDeleted) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check hive membership
      const hive = await StudyHive.findById(message.hive);
      if (!hive || !hive.isMember(socket.userId)) {
        socket.emit('error', { message: 'You are not a member of this hive' });
        return;
      }

      message.addReaction(emoji, socket.userId);
      await message.save();

      // Award points
      const user = await User.findById(socket.userId);
      user.addPoints(2, 'Message Reaction');
      await user.save();

      // Broadcast reaction to hive room
      this.io.to(`hive_${message.hive}`).emit('reaction_added', {
        messageId,
        emoji,
        userId: socket.userId,
        reactions: message.reactions
      });

    } catch (error) {
      console.error('Error handling add reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  }

  // Handle poll voting
  async handlePollVote(socket, data) {
    try {
      const { messageId, optionIndex } = data;

      const message = await Message.findById(messageId);
      if (!message || message.messageType !== 'poll') {
        socket.emit('error', { message: 'Poll not found' });
        return;
      }

      // Check if poll has expired
      if (message.poll.expiresAt && new Date() > message.poll.expiresAt) {
        socket.emit('error', { message: 'This poll has expired' });
        return;
      }

      // Check hive membership
      const hive = await StudyHive.findById(message.hive);
      if (!hive || !hive.isMember(socket.userId)) {
        socket.emit('error', { message: 'You are not a member of this hive' });
        return;
      }

      const voteSuccess = message.addPollVote(optionIndex, socket.userId);
      if (!voteSuccess) {
        socket.emit('error', { message: 'Failed to register vote' });
        return;
      }

      await message.save();

      // Award points
      const user = await User.findById(socket.userId);
      user.addPoints(3, 'Poll Vote');
      await user.save();

      // Broadcast vote to hive room
      this.io.to(`hive_${message.hive}`).emit('poll_vote_updated', {
        messageId,
        poll: message.poll,
        votedBy: socket.userId
      });

    } catch (error) {
      console.error('Error handling poll vote:', error);
      socket.emit('error', { message: 'Failed to register vote' });
    }
  }

  // Handle typing indicators
  handleTypingStart(socket, data) {
    const { hiveId } = data;
    
    // Clear existing typing timeout
    this.clearTypingTimeout(hiveId, socket.userId);

    // Set new typing timeout (10 seconds)
    const timeout = setTimeout(() => {
      this.handleTypingStop(socket, { hiveId });
    }, 10000);

    if (!this.typingUsers.has(hiveId)) {
      this.typingUsers.set(hiveId, new Map());
    }
    this.typingUsers.get(hiveId).set(socket.userId, timeout);

    // Broadcast typing start to other users in hive
    socket.to(`hive_${hiveId}`).emit('user_typing_start', {
      userId: socket.userId,
      username: socket.user.username,
      hiveId
    });
  }

  handleTypingStop(socket, data) {
    const { hiveId } = data;
    
    this.clearTypingTimeout(hiveId, socket.userId);

    // Broadcast typing stop to other users in hive
    socket.to(`hive_${hiveId}`).emit('user_typing_stop', {
      userId: socket.userId,
      hiveId
    });
  }

  // Clear typing timeout
  clearTypingTimeout(hiveId, userId) {
    if (this.typingUsers.has(hiveId)) {
      const hiveTyping = this.typingUsers.get(hiveId);
      if (hiveTyping.has(userId)) {
        clearTimeout(hiveTyping.get(userId));
        hiveTyping.delete(userId);
        
        if (hiveTyping.size === 0) {
          this.typingUsers.delete(hiveId);
        }
      }
    }
  }

  // Handle joining a hive room
  async handleJoinHive(socket, data) {
    try {
      const { hiveId } = data;
      
      // Verify user is member of hive
      const hive = await StudyHive.findById(hiveId);
      if (!hive || !hive.isMember(socket.userId)) {
        socket.emit('error', { message: 'You are not a member of this hive' });
        return;
      }

      socket.join(`hive_${hiveId}`);
      
      // Track hive membership
      if (!this.hiveMembers.has(hiveId)) {
        this.hiveMembers.set(hiveId, new Set());
      }
      this.hiveMembers.get(hiveId).add(socket.userId);

      // Get online users in this hive
      const onlineUsers = this.getOnlineUsersInHive(hiveId);

      socket.emit('hive_joined', { 
        hiveId, 
        onlineUsers: Array.from(onlineUsers),
        hiveName: hive.name
      });

      // Notify other hive members
      socket.to(`hive_${hiveId}`).emit('user_joined_hive', {
        userId: socket.userId,
        username: socket.user.username,
        hiveId
      });

      console.log(`User ${socket.user.username} joined hive room: ${hive.name}`);
    } catch (error) {
      console.error('Error joining hive:', error);
      socket.emit('error', { message: 'Failed to join hive' });
    }
  }

  // Handle leaving a hive room
  handleLeaveHive(socket, data) {
    const { hiveId } = data;
    
    socket.leave(`hive_${hiveId}`);
    
    // Remove from hive members tracking
    if (this.hiveMembers.has(hiveId)) {
      this.hiveMembers.get(hiveId).delete(socket.userId);
      if (this.hiveMembers.get(hiveId).size === 0) {
        this.hiveMembers.delete(hiveId);
      }
    }

    // Clear any typing indicators
    this.clearTypingTimeout(hiveId, socket.userId);

    // Notify other hive members
    socket.to(`hive_${hiveId}`).emit('user_left_hive', {
      userId: socket.userId,
      hiveId
    });

    socket.emit('hive_left', { hiveId });
  }

  // Handle user status updates
  handleUpdateStatus(socket, data) {
    const { status } = data; // 'online', 'away', 'busy', 'invisible'
    
    if (['online', 'away', 'busy', 'invisible'].includes(status)) {
      if (this.connectedUsers.has(socket.userId)) {
        this.connectedUsers.get(socket.userId).status = status;
      }

      this.broadcastUserStatus(socket.userId, status);
    }
  }

  // Handle marking messages as read
  async handleMarkMessagesRead(socket, data) {
    try {
      const { messageIds, hiveId } = data;

      let query = { isDeleted: false };

      if (messageIds && Array.isArray(messageIds)) {
        query._id = { $in: messageIds };
      } else if (hiveId) {
        // Verify hive membership
        const hive = await StudyHive.findById(hiveId);
        if (!hive || !hive.isMember(socket.userId)) {
          socket.emit('error', { message: 'You are not a member of this hive' });
          return;
        }
        query.hive = hiveId;
      }

      // Find unread messages
      const messages = await Message.find({
        ...query,
        'readBy.user': { $ne: socket.userId }
      });

      // Mark as read
      const updatePromises = messages.map(async message => {
        message.markAsRead(socket.userId);
        return message.save();
      });

      await Promise.all(updatePromises);

      // Broadcast read status to hive
      if (hiveId) {
        socket.to(`hive_${hiveId}`).emit('messages_read', {
          userId: socket.userId,
          messageIds: messages.map(m => m._id),
          hiveId
        });
      }

      socket.emit('messages_marked_read', { 
        count: messages.length,
        messageIds: messages.map(m => m._id)
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  // Handle user disconnect
  handleDisconnect(socket) {
    console.log(`User ${socket.user.username} disconnected`);

    const userId = socket.userId;

    // Remove from connected users
    this.connectedUsers.delete(userId);

    // Remove from all hive rooms
    for (const [hiveId, members] of this.hiveMembers.entries()) {
      if (members.has(userId)) {
        members.delete(userId);
        
        // Clear typing indicators
        this.clearTypingTimeout(hiveId, userId);
        
        // Notify hive members
        socket.to(`hive_${hiveId}`).emit('user_left_hive', {
          userId,
          hiveId
        });

        if (members.size === 0) {
          this.hiveMembers.delete(hiveId);
        }
      }
    }

    // Update user status to offline
    this.broadcastUserStatus(userId, 'offline');

    // Update user's last seen time
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec();
  }

  // Broadcast user status to their hives
  broadcastUserStatus(userId, status) {
    for (const [hiveId, members] of this.hiveMembers.entries()) {
      if (members.has(userId)) {
        this.io.to(`hive_${hiveId}`).emit('user_status_update', {
          userId,
          status,
          timestamp: new Date()
        });
      }
    }
  }

  // Get online users in a specific hive
  getOnlineUsersInHive(hiveId) {
    const hiveMembers = this.hiveMembers.get(hiveId);
    if (!hiveMembers) return new Set();

    const onlineUsers = new Set();
    for (const userId of hiveMembers) {
      if (this.connectedUsers.has(userId)) {
        onlineUsers.add(userId);
      }
    }
    return onlineUsers;
  }

  // Send mention notifications
  async sendMentionNotifications(mentions, message) {
    try {
      for (const mentionedUserId of mentions) {
        const connectedUser = this.connectedUsers.get(mentionedUserId.toString());
        if (connectedUser) {
          this.io.to(connectedUser.socketId).emit('mention_notification', {
            message: {
              _id: message._id,
              content: message.content,
              author: message.author,
              hive: message.hive,
              createdAt: message.createdAt
            },
            mentionedBy: {
              _id: message.author._id,
              username: message.author.username,
              fullName: `${message.author.profile.firstName} ${message.author.profile.lastName}`
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending mention notifications:', error);
    }
  }

  // Send system message to hive
  async sendSystemMessage(hiveId, content, data = {}) {
    try {
      const systemMessage = await Message.create({
        content,
        author: null, // System message
        hive: hiveId,
        messageType: 'system',
        ...data
      });

      this.io.to(`hive_${hiveId}`).emit('new_message', {
        message: systemMessage,
        hiveId
      });

      return systemMessage;
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get hive online members count
  getHiveOnlineMembersCount(hiveId) {
    const hiveMembers = this.hiveMembers.get(hiveId);
    if (!hiveMembers) return 0;

    let onlineCount = 0;
    for (const userId of hiveMembers) {
      if (this.connectedUsers.has(userId)) {
        onlineCount++;
      }
    }
    return onlineCount;
  }

  // Broadcast to specific hive
  broadcastToHive(hiveId, event, data) {
    this.io.to(`hive_${hiveId}`).emit(event, data);
  }

  // Broadcast to specific user
  broadcastToUser(userId, event, data) {
    const connectedUser = this.connectedUsers.get(userId);
    if (connectedUser) {
      this.io.to(connectedUser.socketId).emit(event, data);
    }
  }
}

module.exports = new SocketService();
