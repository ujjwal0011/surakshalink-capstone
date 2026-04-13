import User from '../models/user.model.js';

// ─── Credit Packages (hardcoded catalog) ───
const CREDIT_PACKAGES = [
  { id: 'starter',  credits: 2,  cost: 100, emoji: '⚡', label: 'Starter Pack',  description: 'A quick top-up for light usage.' },
  { id: 'standard', credits: 5,  cost: 200, emoji: '🔋', label: 'Standard Pack', description: 'Best value for regular learners.' },
  { id: 'bulk',     credits: 10, cost: 350, emoji: '💎', label: 'Bulk Pack',     description: 'Power through your study sessions.' },
  { id: 'mega',     credits: 25, cost: 750, emoji: '🔥', label: 'Mega Pack',     description: 'Become an AI-powered disaster expert!' },
];

// ─── Daily Reset Helper (rollover — ADD credits, capped) ───
export const resetDailyCredits = (user) => {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  // Initialize aiCredits if it doesn't exist (for existing users before schema change)
  if (!user.aiCredits) {
    user.aiCredits = { summary: 2, chatbot: 3, purchased: 0, lastResetDate: today };
    return true;
  }

  // First-ever access — schema defaults already gave 2+3, just stamp the date
  if (!user.aiCredits.lastResetDate) {
    user.aiCredits.lastResetDate = today;
    return true;
  }

  if (user.aiCredits.lastResetDate !== today) {
    // Rollover: ADD daily allocation, capped
    user.aiCredits.summary = Math.min((user.aiCredits.summary || 0) + 2, 10);
    user.aiCredits.chatbot = Math.min((user.aiCredits.chatbot || 0) + 3, 15);
    user.aiCredits.lastResetDate = today;
    return true; // Credits were reset
  }
  return false; // Already reset today
};

// ─── Deduct Credit Helper ───
// Returns true if credit was deducted, false if insufficient
export const deductCredit = (user, type) => {
  if (type === 'summary') {
    if (user.aiCredits.summary > 0) {
      user.aiCredits.summary -= 1;
      return true;
    }
  } else if (type === 'chatbot') {
    if (user.aiCredits.chatbot > 0) {
      user.aiCredits.chatbot -= 1;
      return true;
    }
  }
  // Fallback to purchased pool
  if (user.aiCredits.purchased > 0) {
    user.aiCredits.purchased -= 1;
    return true;
  }
  return false;
};

// ─── 1. GET /ai/credits — Current balance ───
export const getCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'AI credits are for students only.' });
    }

    const wasReset = resetDailyCredits(user);
    if (wasReset) await user.save();

    res.json({
      summary: user.aiCredits.summary,
      chatbot: user.aiCredits.chatbot,
      purchased: user.aiCredits.purchased,
      total: user.aiCredits.summary + user.aiCredits.chatbot + user.aiCredits.purchased,
      lastResetDate: user.aiCredits.lastResetDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 2. GET /ai/credits/packages — Available packages ───
export const getCreditPackages = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('totalXP');
    res.json({
      packages: CREDIT_PACKAGES.map(pkg => ({
        ...pkg,
        canAfford: user.totalXP >= pkg.cost,
      })),
      totalXP: user.totalXP,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── 3. POST /ai/credits/purchase — Buy credits with XP ───
export const purchaseCredits = async (req, res) => {
  try {
    const { packageId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'AI credits are for students only.' });
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    if (user.totalXP < pkg.cost) {
      return res.status(400).json({
        message: `Not enough XP! You need ${pkg.cost - user.totalXP} more XP.`,
      });
    }

    // Deduct XP, add credits to purchased pool
    user.totalXP -= pkg.cost;
    if (!user.aiCredits) {
      user.aiCredits = { summary: 2, chatbot: 3, purchased: 0, lastResetDate: '' };
    }
    user.aiCredits.purchased += pkg.credits;
    await user.save();

    res.json({
      message: `${pkg.emoji} ${pkg.label} purchased! +${pkg.credits} credits`,
      credits: {
        summary: user.aiCredits.summary,
        chatbot: user.aiCredits.chatbot,
        purchased: user.aiCredits.purchased,
      },
      remainingXP: user.totalXP,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
