import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import { messagesAPI } from '../../services/apiService';
import { SkeletonMessage, TypingIndicator, InlineLoader } from '../Common/Loaders';

const StudyGroupChat = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load initial messages from backend
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const res = await messagesAPI.getMessages(groupId, { limit: 50 });
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const normalized = list.map((m) => ({
          id: m._id,
          user: {
            id: m.author?._id || m.author,
            name: (m.author && (m.author.profile?.firstName || m.author.username))
              ? `${m.author.profile?.firstName || m.author.username}`
              : 'User'
          },
          message: m.content,
          timestamp: m.createdAt,
          type: m.messageType === 'system' ? 'system' : 'message'
        }));
        setMessages(normalized);
      } catch (err) {
        // silently ignore for now
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (groupId) fetchMessages();
    return () => { isMounted = false; };
  }, [groupId]);

  // Socket wiring
  useEffect(() => {
    const status = socketService.getConnectionStatus();
    setIsConnected(!!status.connected);

    const handleConnectionStatus = ({ connected }) => setIsConnected(connected);
    const handleHiveJoined = ({ hiveId, onlineUsers: online }) => {
      if (hiveId === groupId) {
        // Store user IDs; UI shows count
        setOnlineUsers(Array.isArray(online) ? online : []);
        setIsLoading(false);
      }
    };
    const handleNewMessage = ({ message, hiveId }) => {
      if (hiveId !== groupId) return;
      const normalized = {
        id: message?._id || Date.now(),
        user: {
          id: message?.author?._id || message?.author || 'unknown',
          name:
            (message?.author && (message.author.profile?.firstName || message.author.username))
              ? `${message.author.profile?.firstName || message.author.username}`
              : 'User'
        },
        message: message?.content,
        timestamp: message?.createdAt || new Date(),
        type: message?.messageType === 'system' ? 'system' : 'message'
      };
      setMessages(prev => [...prev, normalized]);
    };
    const handleTypingStart = ({ username, userId, hiveId }) => {
      if (hiveId !== groupId) return;
      const name = username || userId || 'Someone';
      setTypingUsers(prev => (prev.includes(name) ? prev : [...prev, name]));
    };
    const handleTypingStop = ({ userId, hiveId }) => {
      if (hiveId !== groupId) return;
      setTypingUsers(prev => prev.filter(n => n !== userId));
    };

    socketService.on('connection_status', handleConnectionStatus);
    socketService.on('hive_joined', handleHiveJoined);
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing_start', handleTypingStart);
    socketService.on('user_typing_stop', handleTypingStop);

    if (groupId) {
      socketService.joinHive(groupId);
    }

    const loadingTimer = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      clearTimeout(loadingTimer);
      if (groupId) {
        socketService.leaveHive(groupId);
      }
      socketService.off('connection_status', handleConnectionStatus);
      socketService.off('hive_joined', handleHiveJoined);
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing_start', handleTypingStart);
      socketService.off('user_typing_stop', handleTypingStop);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageText = newMessage;
    setNewMessage('');

    try {
      const tempId = `tmp_${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: tempId,
          user: { id: user?.id || 'me', name: user?.username || user?.profile?.firstName || 'Me' },
      message: messageText,
      timestamp: new Date(),
      type: 'message'
        }
      ]);
      socketService.sendMessage({ content: messageText, hiveId: groupId, messageType: 'text' });
    } finally {
    setIsSending(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (groupId && isConnected) {
      socketService.startTyping(groupId);
    }
    
    // Clear previous timeout and set new one to stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (groupId && isConnected) {
        socketService.stopTyping(groupId);
      }
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageItem = ({ message }) => {
    if (message.type === 'system') {
      return (
        <div className="flex justify-center my-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {message.message}
          </span>
        </div>
      );
    }

    const isCurrentUser = message.user.id === user?.id;

    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {!isCurrentUser && (
            <p className="text-xs font-medium mb-1 opacity-70">{message.user.name}</p>
          )}
          <p className="text-sm">{message.message}</p>
          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white opacity-70' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div>
          <h3 className="font-semibold text-gray-900">{groupName} Chat</h3>
          <p className="text-sm text-gray-600">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {onlineUsers.length} members online
          </p>
        </div>
        <div className="flex -space-x-1">
          {onlineUsers.slice(0, 3).map((id) => (
            <div
              key={id}
              className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
              title={String(id)}
            >
              {String(id).charAt(0)}
            </div>
          ))}
          {onlineUsers.length > 3 && (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto max-h-96">
        {isLoading ? (
          // Show loading skeletons while messages are loading
          <>            
            <SkeletonMessage />
            <SkeletonMessage isOwn />
            <SkeletonMessage />
            <SkeletonMessage isOwn />
          </>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            {typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={!isConnected || isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected || isSending}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSending ? (
              <InlineLoader size="sm" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudyGroupChat;
