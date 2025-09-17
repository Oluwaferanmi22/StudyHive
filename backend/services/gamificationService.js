const POINTS = {
  AI_TUTOR_ANSWER: 2,
  AI_TUTOR_FIRST_OF_DAY_BONUS: 5,
};

const BADGES = [
  { name: 'Level 5', level: 5, description: 'Reached Level 5', icon: '🏅' },
  { name: 'Level 10', level: 10, description: 'Reached Level 10', icon: '🥇' },
  { name: '7‑Day Streak', streak: 7, description: 'Kept a 7‑day learning streak', icon: '🔥' },
];

function maybeAwardBadge(user) {
  try {
    const lvl = user.gamification?.level || 1;
    const streak = user.gamification?.streak?.current || 0;

    for (const def of BADGES) {
      if (def.level && lvl >= def.level) {
        user.addBadge(def.name, def.description, def.icon);
      }
      if (def.streak && streak >= def.streak) {
        user.addBadge(def.name, def.description, def.icon);
      }
    }
  } catch (_) {}
}

async function awardPoints(req, user, amount, reason, options = {}) {
  const beforeLevel = user.gamification?.level || 1;
  user.addPoints(amount, reason || 'activity');
  maybeAwardBadge(user);
  await user.save();

  const afterLevel = user.gamification?.level || beforeLevel;
  const leveledUp = afterLevel > beforeLevel;

  try {
    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('gamification:update', {
        success: true,
        delta: amount,
        reason,
        points: user.gamification.points,
        level: afterLevel,
        leveledUp,
        badges: user.gamification.badges,
      });
    }
  } catch (_) {}
}

module.exports = {
  POINTS,
  awardPoints,
};
