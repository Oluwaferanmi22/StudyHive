import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AITutor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('general');
  const [isTyping, setIsTyping] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Mock premium status
  const messagesEndRef = useRef(null);

  const subjects = [
    { id: 'general', name: 'General Help', icon: '🎓', description: 'General academic assistance' },
    { id: 'mathematics', name: 'Mathematics', icon: '📊', description: 'Algebra, Calculus, Statistics' },
    { id: 'science', name: 'Science', icon: '🔬', description: 'Physics, Chemistry, Biology' },
    { id: 'programming', name: 'Programming', icon: '💻', description: 'JavaScript, Python, Algorithms' },
    { id: 'writing', name: 'Writing', icon: '✍️', description: 'Essays, Grammar, Literature' },
    { id: 'history', name: 'History', icon: '📚', description: 'World History, Analysis' },
    { id: 'languages', name: 'Languages', icon: '🌍', description: 'Foreign Languages, Translation' }
  ];

  const initialMessage = {
    id: 1,
    type: 'ai',
    content: `Hello! I'm your AI Study Assistant. I'm here to help you with your studies across various subjects. 

${isPremium ? 
  `🎉 **Premium Features Available:**
  - Unlimited questions per day
  - Advanced explanations with step-by-step solutions
  - Custom study plans
  - Voice interaction (coming soon)
  - Priority support` :
  `📝 **Free Tier:**
  - 5 questions per day (4 remaining)
  - Basic explanations
  - General study help
  
  💎 **Upgrade to Premium for:**
  - Unlimited questions
  - Advanced explanations
  - Custom study plans
  - Priority support`}

How can I help you learn today?`,
    timestamp: new Date(),
    subject: selectedSubject
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mock AI responses based on subject and question
  const generateAIResponse = (question, subject) => {
    const responses = {
      mathematics: [
        "Great math question! Let me break this down step by step for you.",
        "Mathematics is all about patterns and logic. Here's how I'd approach this problem:",
        "This is a classic problem in mathematics. Let me explain the concept first, then we'll solve it together.",
      ],
      science: [
        "Excellent science question! Let's explore this concept together.",
        "Science is fascinating! This relates to some fundamental principles. Let me explain:",
        "Great observation! This touches on an important scientific principle. Here's what's happening:",
      ],
      programming: [
        "Nice coding question! Let's debug this step by step.",
        "Programming is about breaking problems into smaller pieces. Here's my approach:",
        "Great question! This is a common challenge in programming. Let me show you a solution:",
      ],
      writing: [
        "Excellent writing question! Let me help you improve your composition.",
        "Writing is an art! Here are some techniques that can help:",
        "Great question about writing! Let's work on making your text more engaging:",
      ],
      general: [
        "That's a thoughtful question! Let me help you understand this better.",
        "Great question! I'm here to help you learn. Here's my explanation:",
        "Thanks for asking! Learning is a journey, and I'm here to guide you:",
      ]
    };

    const subjectResponses = responses[subject] || responses.general;
    const randomResponse = subjectResponses[Math.floor(Math.random() * subjectResponses.length)];

    // Add some subject-specific content
    const additionalContent = {
      mathematics: "\n\n🔢 **Mathematical Approach:**\n1. Identify what we know\n2. Determine what we need to find\n3. Choose the appropriate formula/method\n4. Solve step by step\n5. Check our answer\n\nWould you like me to work through a specific problem?",
      science: "\n\n🔬 **Scientific Method:**\n1. Observe the phenomenon\n2. Form a hypothesis\n3. Test through experimentation\n4. Analyze results\n5. Draw conclusions\n\nWhat specific area of science interests you most?",
      programming: "\n\n💻 **Coding Best Practices:**\n1. Break down the problem\n2. Write pseudocode first\n3. Implement in small steps\n4. Test frequently\n5. Refactor and optimize\n\nWhat programming language are you working with?",
      writing: "\n\n✍️ **Writing Tips:**\n1. Start with a clear thesis\n2. Organize your thoughts\n3. Use concrete examples\n4. Revise for clarity\n5. Proofread carefully\n\nWhat type of writing are you working on?",
      general: "\n\n🎓 **Study Strategy:**\n1. Break topics into manageable chunks\n2. Use active recall techniques\n3. Practice spaced repetition\n4. Connect new info to what you know\n5. Teach concepts to others\n\nWhat subject would you like to focus on?"
    };

    return randomResponse + (additionalContent[subject] || additionalContent.general);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Check daily limit for free users
    if (!isPremium && messages.filter(m => m.type === 'user').length >= 5) {
      const limitMessage = {
        id: Date.now(),
        type: 'ai',
        content: "🚫 **Daily Limit Reached**\n\nYou've reached your daily limit of 5 questions on the free plan.\n\n💎 **Upgrade to Premium** for unlimited questions and advanced features!\n\n📅 Your limit will reset tomorrow.",
        timestamp: new Date(),
        subject: selectedSubject
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

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

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(newMessage, selectedSubject),
        timestamp: new Date(),
        subject: selectedSubject
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
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
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            }`}>
              {isUser ? (user?.name?.charAt(0) || 'U') : '🤖'}
            </div>
            <div className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="text-4xl mr-3">🤖</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Study Assistant
            </h1>
            {isPremium && (
              <span className="ml-3 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-sm font-medium rounded-full">
                ✨ Premium
              </span>
            )}
          </div>
          <p className="text-gray-600">Your personal AI tutor available 24/7 to help with any subject</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Subject Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Select Subject</h3>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleSubjectChange(subject.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSubject === subject.id
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-purple-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{subject.icon}</span>
                      <div>
                        <div className="font-medium">{subject.name}</div>
                        <div className="text-xs text-gray-500">{subject.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!isPremium && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">💎 Upgrade to Premium</h4>
                  <p className="text-xs text-yellow-700 mb-3">
                    Unlock unlimited questions, advanced explanations, and more!
                  </p>
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-sm font-medium rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-colors">
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                      🤖
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">AI Study Assistant</h3>
                      <p className="text-sm text-gray-600">
                        Currently helping with {subjects.find(s => s.id === selectedSubject)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {isPremium ? 'Unlimited' : `${Math.max(0, 5 - messages.filter(m => m.type === 'user').length)} left today`}
                    </div>
                    <div className="text-xs text-gray-500">Questions remaining</div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.map((message) => (
                  <MessageItem key={message.id} message={message} />
                ))}
                
                {isTyping && (
                  <div className="flex justify-start mb-6">
                    <div className="max-w-3xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                          🤖
                        </div>
                        <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl">
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
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Ask about ${subjects.find(s => s.id === selectedSubject)?.name.toLowerCase()}...`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isTyping}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
