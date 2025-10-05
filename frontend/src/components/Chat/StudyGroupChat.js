import React, { useState, useEffect, useRef } from 'react';
import socketService from '../../services/socketService';
import { useAuth } from '../../pages/contexts/AuthContext';
import { messagesAPI, hivesAPI } from '../../services/apiService';
import { buildFileUrl } from '../../api';
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
  const [members, setMembers] = useState([]);
  const [showMemberList, setShowMemberList] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  // Default OFF and enforced
  const [autoAIEnabled, setAutoAIEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const [toast, setToast] = useState(null); // { text, delta, levelUp }
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

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
          type: m.messageType === 'system' ? 'system' : m.messageType || 'message',
          messageType: m.messageType,
          attachments: m.attachments || [],
          mentions: m.mentions || [],
          voiceNote: m.voiceNote,
          aiResponse: m.aiResponse
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

  // Gamification toast listener
  useEffect(() => {
    const handler = (data) => {
      if (!data) return;
      const txt = `${data.delta > 0 ? '+' : ''}${data.delta} XP` + (data.leveledUp ? ' • Level Up! 🎉' : '');
      setToast({ text: txt });
      setTimeout(() => setToast(null), 2500);
    };
    socketService.on('gamification:update', handler);
    return () => socketService.off('gamification:update', handler);
  }, []);

  // Enforce Auto AI OFF regardless of any previous preference
  useEffect(() => {
    setAutoAIEnabled(false);
  }, [groupId]);

  // Load group members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await hivesAPI.getHiveMembers(groupId);
        if (res.success) {
          setMembers(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching members:', err);
      }
    };
    if (groupId) fetchMembers();
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
        type: message?.messageType === 'system' ? 'system' : 'message',
        messageType: message?.messageType || 'text',
        attachments: message?.attachments || [],
        voiceNote: message?.voiceNote,
        aiResponse: message?.aiResponse,
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
      // If the message starts with "/ai", route it to the AI (free in group chat)
      const aiPrefixMatch = messageText.trim().match(/^\/(ai|ask)\s+(.*)$/i);
      const shouldRouteToAI = !!aiPrefixMatch;
      if (shouldRouteToAI) {
        const aiPrompt = aiPrefixMatch ? aiPrefixMatch[2] : messageText.trim();

        // Show the user's question immediately
        const tempId = `tmp_${Date.now()}`;
        setMessages(prev => [
          ...prev,
          {
            id: tempId,
            user: { id: user?.id || 'me', name: user?.username || user?.profile?.firstName || 'Me' },
            message: aiPrompt,
            timestamp: new Date(),
            type: 'message',
            messageType: 'text'
          }
        ]);

        // Send to backend as an AI message
        const res = await messagesAPI.sendMessage({
          content: aiPrompt,
          hiveId: groupId,
          messageType: 'ai'
        });

        if (res?.success) {
          const aiResponseId = `ai_${Date.now()}`;
          setMessages(prev => [
            ...prev,
            {
              id: aiResponseId,
              user: { id: 'ai', name: 'AI Assistant' },
              message: res.data?.content || 'Here is the answer.',
              timestamp: new Date(),
              type: 'ai',
              messageType: 'ai',
              aiResponse: res.data?.aiResponse
            }
          ]);
        }
      } else {
        // Normal text message
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
      }
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
        const blob = new Blob(chunks, { type: mimeType });
        await sendVoiceMessage(blob);
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    try {
      setIsSending(true);
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-message.webm');
      formData.append('hiveId', groupId);
      formData.append('content', '[Voice Message]');

      const res = await messagesAPI.sendMessage(formData);
      if (res.success) {
        // Add to local messages immediately
        const tempId = `tmp_${Date.now()}`;
        setMessages(prev => [
          ...prev,
          {
            id: tempId,
            user: { id: user?.id || 'me', name: user?.username || user?.profile?.firstName || 'Me' },
            message: '[Voice Message]',
            timestamp: new Date(),
            type: 'voice',
            messageType: 'voice',
            voiceNote: { duration: 0 } // Will be updated when real message arrives
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Image upload functions
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setShowImageUpload(true);
    }
  };

  const sendImageMessage = async () => {
    if (!selectedImage) return;

    try {
      setIsSending(true);
      const formData = new FormData();
      formData.append('file', selectedImage); // Changed from 'image' to 'file'
      formData.append('hiveId', groupId);
      formData.append('content', newMessage || '');

      const res = await messagesAPI.sendMessage(formData);
      if (res.success) {
        setNewMessage('');
        setSelectedImage(null);
        setShowImageUpload(false);
      }
    } catch (error) {
      console.error('Error sending image:', error);
    } finally {
      setIsSending(false);
    }
  };

  // AI Assistant functions
  const sendAIMessage = async () => {
    if (!aiMessage.trim()) return;

    try {
      setIsSending(true);
      
      // Add user message immediately
      const tempId = `tmp_${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: tempId,
          user: { id: user?.id || 'me', name: user?.username || user?.profile?.firstName || 'Me' },
          message: aiMessage,
          timestamp: new Date(),
          type: 'message',
          messageType: 'text'
        }
      ]);

      // Send AI request
      const res = await messagesAPI.sendMessage({
        content: aiMessage,
        hiveId: groupId,
        messageType: 'ai'
      });

      if (res.success) {
        // Add AI response
        const aiResponseId = `ai_${Date.now()}`;
        setMessages(prev => [
          ...prev,
          {
            id: aiResponseId,
            user: { id: 'ai', name: 'AI Assistant' },
            message: res.data.content || 'I received your message and I\'m here to help!',
            timestamp: new Date(),
            type: 'ai',
            messageType: 'ai',
            aiResponse: res.data.aiResponse
          }
        ]);
        setAiMessage('');
        setShowAIAssistant(false);
      } else {
        // Surface backend error as a chat bubble for visibility
        const errorId = `ai_err_${Date.now()}`;
        setMessages(prev => [
          ...prev,
          {
            id: errorId,
            user: { id: 'ai', name: 'AI Assistant' },
            message: res.message || 'AI could not answer right now. Please try again.',
            timestamp: new Date(),
            type: 'ai',
            messageType: 'ai'
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending AI message:', error);
      // Add error message
      const errorId = `error_${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: errorId,
          user: { id: 'ai', name: 'AI Assistant' },
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          type: 'ai',
          messageType: 'ai'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Member tagging functions
  const insertMention = (member) => {
    const mention = `@${member.userId.username} `;
    setNewMessage(prev => prev + mention);
    setShowMemberList(false);
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

    const renderMessageContent = () => {
      switch (message.messageType) {
        case 'image':
          return (
            <div>
              {message.attachments?.map((attachment, index) => (
                <img
                  key={index}
                  src={buildFileUrl(attachment.filePath)}
                  alt={attachment.fileName}
                  className="max-w-full h-auto rounded-lg mb-2"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              ))}
            </div>
          );
        case 'voice': {
          const playVoiceNote = () => {
            if (message.attachments && message.attachments.length > 0) {
              const audio = new Audio(buildFileUrl(message.attachments[0].filePath));
              audio.play().catch(console.error);
            }
          };
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={playVoiceNote}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.5 14H3a1 1 0 01-1-1V7a1 1 0 011-1h2.5l2.883-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              </button>
              <div>
                <p className="text-sm">Voice Message</p>
                {message.voiceNote?.duration && (
                  <p className="text-xs opacity-70">{Math.round(message.voiceNote.duration)}s</p>
                )}
              </div>
            </div>
          );
        }
        case 'ai':
          return (
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  🤖 AI Assistant
                </span>
                {message.aiResponse?.model && (
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                    {message.aiResponse.model.includes('gpt') ? 'OpenAI' : message.aiResponse.model}
                  </span>
                )}
              </div>
              <p className="text-sm">{message.aiResponse?.answer || message.message}</p>
            </div>
          );
        default:
          return <p className="text-sm">{message.message}</p>;
      }
    };

    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-primary-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {!isCurrentUser && (
            <p className="text-xs font-medium mb-1 opacity-70">{message.user.name}</p>
          )}
          {renderMessageContent()}
          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white opacity-70' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{groupName} Chat</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {onlineUsers.length} members online
          </p>
        </div>
        <div className="flex -space-x-1">
          {onlineUsers.slice(0, 3).map((id) => (
            <div
              key={id}
              className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
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

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Send Image</h3>
            {selectedImage && (
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a caption (optional)..."
              className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg mb-4"
              rows="3"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowImageUpload(false);
                  setSelectedImage(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={sendImageMessage}
                disabled={isSending}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Ask AI Assistant</h3>
            <textarea
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="Ask the AI assistant anything..."
              className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg mb-4"
              rows="4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAIAssistant(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={sendAIMessage}
                disabled={!aiMessage.trim() || isSending}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Ask AI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member List Modal */}
      {showMemberList && (
        <div className="absolute bottom-16 left-4 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-40">
          <div className="p-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Tag Members</h4>
            {members.map((member) => (
              <button
                key={member.userId._id}
                onClick={() => insertMention(member)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm">
                  {member.userId.profile?.firstName?.charAt(0) || member.userId.username.charAt(0)}
                </div>
                <span className="text-sm text-gray-900 dark:text-gray-100">{member.userId.profile?.firstName || member.userId.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={"Type your message... (use @ to tag members, /ai question for AI)"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={!isConnected || isSending}
              onFocus={() => setShowMemberList(newMessage.includes('@'))}
            />
            {showMemberList && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-40">
                <div className="p-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Tag Members</h4>
                  {members.map((member) => (
                    <button
                      key={member.userId._id}
                      onClick={() => insertMention(member)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2"
                    >
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm">
                        {member.userId.profile?.firstName?.charAt(0) || member.userId.username.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{member.userId.profile?.firstName || member.userId.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-1">
            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
              disabled={!isConnected || isSending}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Voice Recording Button */}
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-500 hover:text-primary-500 hover:bg-primary-50'
              }`}
              disabled={!isConnected || isSending}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>

            {/* AI Assistant Modal Button */}
            <button
              type="button"
              onClick={() => setShowAIAssistant(true)}
              className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
              disabled={!isConnected || isSending}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected || isSending}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </form>
    </div>
  );
};

export default StudyGroupChat;
