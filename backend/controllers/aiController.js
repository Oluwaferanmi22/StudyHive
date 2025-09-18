const User = require('../models/User');
const aiTutorService = require('../services/aiTutorService');
const { POINTS, awardPoints } = require('../services/gamificationService');

// @desc    Ask the AI tutor a question
// @route   POST /api/ai/ask
// @access  Private
const ask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question, subject = 'general' } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Enforce usage limits
    if (!user.canUseAITutor()) {
      return res.status(403).json({
        success: false,
        message: 'Daily limit reached. Upgrade to premium for unlimited access.',
        data: {
          canUse: false,
          remainingToday: 0,
          dailyLimit: 20,
        },
      });
    }

    // Educational-only guard (configurable). Set AI_EDU_ONLY=false to disable this.
    const EDU_ONLY = String(process.env.AI_EDU_ONLY || 'true').toLowerCase() !== 'false' ;
    if (EDU_ONLY) {
      if (!aiTutorService.isEducationalQuestion(question)) {
        const answer = aiTutorService.educationalGuidanceMessage(subject);
        return res.status(200).json({
          success: true,
          data: {
            answer,
            subject,
            provider: 'policy',
            model: 'edu-guard'
          }
        });
      }
    }

    // Generate answer with provider/model metadata
    const { answer, provider, model } = await aiTutorService.generateAnswerWithMeta(question, subject);

    // Increment usage after a successful answer
    const beforeDaily = user.usage?.aiTutorMessages?.daily?.count || 0;
    user.incrementAITutorUsage();
    await user.save();

    // Gamification: award points (+ first-of-day bonus)
    const base = POINTS.AI_TUTOR_ANSWER;
    const bonus = beforeDaily === 0 ? POINTS.AI_TUTOR_FIRST_OF_DAY_BONUS : 0;
    if (base) await awardPoints(req, user, base, 'ai_tutor');
    if (bonus) await awardPoints(req, user, bonus, 'ai_tutor_first_of_day');

    return res.status(200).json({
      success: true,
      data: {
        answer,
        subject,
        provider: provider || 'builtin',
        model: model || 'study-hive-ai',
      },
    });
  } catch (error) {
    console.error('AI ask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    AI service health/provider info
// @route   GET /api/ai/health
// @access  Public
const health = async (req, res) => {
  try {
    const info = aiTutorService.getProviderInfo ? aiTutorService.getProviderInfo() : {
      provider: (process.env.OPENAI_API_KEY ? 'openai' : 'builtin'),
      model: (process.env.OPENAI_API_KEY ? (process.env.OPENAI_MODEL || 'gpt-3.5-turbo') : 'study-hive-ai'),
      forcedBuiltin: String(process.env.AI_FORCE_BUILTIN || '').toLowerCase() === 'true',
    };
    return res.status(200).json({ success: true, data: info });
  } catch (e) {
    return res.status(200).json({ success: true, data: { provider: 'builtin', model: 'study-hive-ai' } });
  }
};

module.exports = { ask, health };
 
