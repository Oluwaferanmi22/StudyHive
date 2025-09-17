import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../../components/Common/PaymentModal';
import { paymentsAPI, aiAPI } from '../../services/apiService';
import socketService from '../../services/socketService';

const AITutor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('general');
  const [isTyping, setIsTyping] = useState(false);
  const [isPremium, setIsPremium] = useState(!!user?.isPremium);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [usage, setUsage] = useState({
    daily: 0,
    total: 0,
    dailyLimit: 20,
    remainingToday: 20
  });
  const messagesEndRef = useRef(null);
  const [toast, setToast] = useState(null); // { text, delta, levelUp }

  const subjects = [
    { id: 'general', name: 'General Help', icon: '🎓', description: 'General academic assistance' },
    { id: 'mathematics', name: 'Mathematics', icon: '📊', description: 'Algebra, Calculus, Statistics' },
    { id: 'science', name: 'Science', icon: '🔬', description: 'Physics, Chemistry, Biology' },
    { id: 'programming', name: 'Programming', icon: '💻', description: 'JavaScript, Python, Algorithms' },
    { id: 'writing', name: 'Writing', icon: '✍️', description: 'Essays, Grammar, Literature' },
    { id: 'history', name: 'History', icon: '📚', description: 'World History, Analysis' },
    { id: 'languages', name: 'Languages', icon: '🌍', description: 'Foreign Languages, Translation' }
  ];

  // Load usage data on component mount
  useEffect(() => {
    loadUsageData();
  }, []);

  // Gamification toast listener
  useEffect(() => {
    const handler = (data) => {
      if (!data) return;
      const txt = `${data.delta > 0 ? '+' : ''}${data.delta} XP` + (data.leveledUp ? ' • Level Up! 🎉' : '');
      setToast({ text: txt, delta: data.delta, levelUp: !!data.leveledUp });
      setTimeout(() => setToast(null), 2500);
    };
    socketService.on('gamification:update', handler);
    return () => socketService.off('gamification:update', handler);
  }, []);

  const loadUsageData = async () => {
    try {
      const response = await paymentsAPI.getUserUsage();
      if (response.success) {
        setUsage(response.data.aiTutorUsage);
        setIsPremium(response.data.isPremium);
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Allow any input topics

  // Backend-powered responses via API
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Build and show user message first

      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: newMessage,
        timestamp: new Date(),
        subject: selectedSubject
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsTyping(true);

      // Call backend AI
      const resp = await aiAPI.ask({ question: userMessage.content, subject: selectedSubject });

      if (!resp.success) {
        // If 403 limit, show upgrade message
        const limitText = resp.message || 'Daily limit reached. Upgrade to premium for unlimited access.';
        const limitMessage = {
          id: Date.now(),
          type: 'ai',
          content: `🚫 ${limitText}`,
          timestamp: new Date(),
          subject: selectedSubject
        };
        setMessages(prev => [...prev, limitMessage]);
        setIsTyping(false);
        return;
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: resp.data?.answer || 'Here is my response.',
        timestamp: new Date(),
        subject: selectedSubject,
        provider: resp.data?.provider,
        model: resp.data?.model
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      // Refresh usage from backend so UI stays accurate
      loadUsageData();

    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      const errorMessage = {
        id: Date.now(),
        type: 'ai',
        content: "❌ **Error**\n\nSorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
        subject: selectedSubject
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    const subject = subjects.find(s => s.id === subjectId);
    
    const changeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Great! I've switched to **${subject.name}** mode. ${subject.description}\n\nI'm now optimized to help you with ${subject.name.toLowerCase()} questions. What would you like to learn?`,
      timestamp: new Date(),
      subject: subjectId
    };

    setMessages(prev => [...prev, changeMessage]);
  };

  const MessageItem = ({ message }) => {
    const isUser = message.type === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`max-w-3xl ${isUser ? 'order-1' : 'order-2'}`}>
          <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isUser 
                ? 'bg-primary-500 text-white' 
                : 'bg-purple-500 text-white'
            }`}>
              {isUser ? (user?.name?.charAt(0) || 'U') : '🤖'}
            </div>
            <div className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-primary-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              {!isUser && (message.provider || (message.provider === 'openai' && message.model)) && (
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    🤖 {message.provider === 'openai' ? 'OpenAI' : 'AI Assistant'}
                  </span>
                  {message.provider === 'openai' && message.model && (
                    <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                      {message.model}
                    </span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-2 ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {!isUser && (
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {subjects.find(s => s.id === message.subject)?.icon} {subjects.find(s => s.id === message.subject)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="text-4xl mr-3">🤖</div>
            <h1 className="text-3xl font-bold text-purple-600">
              AI Study Assistant
            </h1>
            {isPremium && (
              <span className="ml-3 px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-medium rounded-full">
                ✨ Premium
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300">Your personal AI tutor available 24/7 to help with any subject</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Subject Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Subject</h3>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectChange(subject.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSubject === subject.id
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{subject.icon}</span>
                      <div>
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{subject.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!isPremium && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">💎 Upgrade to Premium</h4>
                  <p className="text-xs text-yellow-700 mb-3">
                    Unlock unlimited questions, advanced explanations, and more!
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full px-4 py-2 bg-yellow-400 text-yellow-900 text-sm font-medium rounded-lg hover:bg-yellow-500 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      🤖
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Study Assistant</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Currently helping with {subjects.find(s => s.id === selectedSubject)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {isPremium ? 'Unlimited' : `${usage.remainingToday} left today`}
                    </div>
                    <div className="text-xs text-gray-500">Questions remaining</div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {messages.map((message) => (
                  <MessageItem key={message.id} message={message} />
                ))}
                
                {isTyping && (
                  <div className="flex justify-start mb-6">
                    <div className="max-w-3xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                          🤖
                        </div>
                        <div className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Ask about ${subjects.find(s => s.id === selectedSubject)?.name.toLowerCase()}...`}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isTyping}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    💡 Tip: Be specific with your questions for better help!
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Powered by AI</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </form>
              {toast && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 text-white text-sm rounded-full shadow-lg">
                  {toast.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          loadUsageData(); // Reload usage data after successful payment
          setShowPaymentModal(false);
        }}
      />
    </div>
  );
};

export default AITutor;
