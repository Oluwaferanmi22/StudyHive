import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AIMatchingQuiz = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const quizSteps = [
    {
      id: 'subjects',
      title: 'What subjects are you most interested in?',
      type: 'multiple',
      options: [
        'Mathematics', 'Science (Physics/Chemistry/Biology)', 'Computer Science/Programming',
        'Literature & Writing', 'History', 'Foreign Languages', 'Business/Economics',
        'Art & Design', 'Engineering', 'Social Sciences'
      ]
    },
    {
      id: 'level',
      title: 'What\'s your current academic level?',
      type: 'single',
      options: [
        'High School', 'College/University Undergraduate', 'Graduate School',
        'Professional/Continuing Education', 'Self-Learning/Hobby'
      ]
    },
    {
      id: 'goals',
      title: 'What are your main study goals?',
      type: 'multiple',
      options: [
        'Exam Preparation', 'Homework Help', 'Concept Understanding',
        'Skill Development', 'Research Projects', 'Career Advancement',
        'Personal Interest', 'Teaching Others'
      ]
    },
    {
      id: 'schedule',
      title: 'When do you prefer to study?',
      type: 'multiple',
      options: [
        'Early Morning (6AM-9AM)', 'Morning (9AM-12PM)', 'Afternoon (12PM-5PM)',
        'Evening (5PM-8PM)', 'Night (8PM-11PM)', 'Late Night (11PM+)',
        'Weekdays Only', 'Weekends Only', 'Flexible/Any Time'
      ]
    },
    {
      id: 'style',
      title: 'How do you learn best?',
      type: 'single',
      options: [
        'Visual (diagrams, charts, videos)', 'Auditory (discussions, lectures)',
        'Kinesthetic (hands-on, practice)', 'Reading/Writing (notes, texts)',
        'Group Discussions', 'Solo Study', 'Mixed Approach'
      ]
    },
    {
      id: 'strengths',
      title: 'What are your academic strengths?',
      type: 'multiple',
      options: [
        'Problem Solving', 'Creative Thinking', 'Analytical Skills',
        'Communication', 'Research', 'Leadership', 'Organization',
        'Technical Skills', 'Teaching Others', 'Quick Learning'
      ]
    }
  ];

  const handleAnswer = (questionId, answer, isMultiple = false) => {
    if (isMultiple) {
      const currentAnswers = answers[questionId] || [];
      const updatedAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer];
      setAnswers({ ...answers, [questionId]: updatedAnswers });
    } else {
      setAnswers({ ...answers, [questionId]: answer });
    }
  };

  const handleNext = () => {
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const recommendations = generateRecommendations(answers);
      onComplete(recommendations);
      setIsAnalyzing(false);
    }, 3000);
  };

  const generateRecommendations = (userAnswers) => {
    // Mock AI recommendation logic
    const subjects = userAnswers.subjects || [];
    const level = userAnswers.level || '';
    const goals = userAnswers.goals || [];
    
    return [
      {
        groupName: `${subjects[0]} Study Circle`,
        match: '95%',
        reason: `Perfect match for your ${level} level and ${goals[0]} goals`,
        members: Math.floor(Math.random() * 20) + 5,
        subject: subjects[0],
        level: level
      },
      {
        groupName: `Advanced ${subjects[1]} Group`,
        match: '88%',
        reason: `Great fit for your learning style and schedule preferences`,
        members: Math.floor(Math.random() * 15) + 8,
        subject: subjects[1],
        level: level
      },
      {
        groupName: `${goals[0]} Success Team`,
        match: '82%',
        reason: `Aligned with your main study objectives`,
        members: Math.floor(Math.random() * 18) + 6,
        subject: 'Multi-Subject',
        level: level
      }
    ];
  };

  const currentQuestion = quizSteps[currentStep];
  const progress = ((currentStep + 1) / quizSteps.length) * 100;

  if (isAnalyzing) {
    return (
      <div className="text-center py-12">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-purple-600 animate-spin" style={{ 
            borderTopColor: 'transparent',
            borderRightColor: 'transparent' 
          }}></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">🤖 AI is analyzing your preferences...</h3>
        <p className="text-gray-600">Finding the perfect study groups for you</p>
        <div className="mt-6 space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Processing learning preferences</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span>Matching with compatible groups</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span>Calculating compatibility scores</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-700">Question {currentStep + 1} of {quizSteps.length}</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentQuestion.title}</h3>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = currentQuestion.type === 'multiple' 
              ? (answers[currentQuestion.id] || []).includes(option)
              : answers[currentQuestion.id] === option;

            return (
              <button
                key={index}
                onClick={() => handleAnswer(currentQuestion.id, option, currentQuestion.type === 'multiple')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                    isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full m-auto"></div>}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {currentQuestion.type === 'multiple' && (
          <p className="mt-4 text-sm text-gray-500">💡 You can select multiple options</p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || (Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].length === 0)}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === quizSteps.length - 1 ? 'Find My Groups' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIMatchingQuiz;
