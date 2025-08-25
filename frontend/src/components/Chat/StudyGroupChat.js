import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import io from 'socket.io-client';

const StudyGroupChat = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Mock messages for demo (in real app, this would come from Socket.IO)
  const mockMessages = [
    {
      id: 1,
      user: { name: 'Sarah Johnson', id: '2' },
      message: 'Hey everyone! Ready for today\'s study session?',
      timestamp: new Date(Date.now() - 3600000),
      type: 'message'
    },
    {
      id: 2,
      user: { name: 'Mike Chen', id: '3' },
      message: 'Yes! I have some great notes to share on Chapter 5.',
      timestamp: new Date(Date.now() - 3500000),
      type: 'message'
    },
    {
      id: 3,
      user: { name: 'System', id: 'system' },
      message: 'Alex Rivera joined the study group',
      timestamp: new Date(Date.now() - 3000000),
      type: 'system'
    },
    {
      id: 4,
      user: { name: 'Alex Rivera', id: '4' },
      message: 'Thanks for having me! Looking forward to learning together.',
      timestamp: new Date(Date.now() - 2800000),
      type: 'message'
    }
  ];

  useEffect(() => {
    // Initialize with mock messages
    setMessages(mockMessages);

    // In a real app, you would connect to Socket.IO server here:
    // socketRef.current = io('http://localhost:5000');
    // 
    // socketRef.current.emit('join-group', { groupId, user });
    // 
    // socketRef.current.on('connect', () => setIsConnected(true));
    // socketRef.current.on('disconnect', () => setIsConnected(false));
    // socketRef.current.on('new-message', handleNewMessage);
    // socketRef.current.on('user-joined', handleUserJoined);
    // socketRef.current.on('user-left', handleUserLeft);
    // socketRef.current.on('online-users', setOnlineUsers);

    // Mock connection status
    setIsConnected(true);
    setOnlineUsers([
      { id: '2', name: 'Sarah Johnson' },
      { id: '3', name: 'Mike Chen' },
      { id: '4', name: 'Alex Rivera' }
    ]);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      user: user,
      message: newMessage,
      timestamp: new Date(),
      type: 'message'
    };

    // In real app: socketRef.current.emit('send-message', message);
    // For demo, add to local state
    setMessages(prev => [...prev, message]);
    setNewMessage('');
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
          {onlineUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
              title={user.name}
            >
              {user.name.charAt(0)}
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
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudyGroupChat;
