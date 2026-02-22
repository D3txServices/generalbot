// ─────────────────────────────────────────────────────────────
// BAD WORDS & PHRASES LIST
// Add or remove any words/phrases as needed
// All matching is case-insensitive
// ─────────────────────────────────────────────────────────────

const BAD_WORDS = [
  // General profanity
  'fuck', 'shit', 'bitch', 'ass', 'asshole', 'bastard', 'cunt',
  'dick', 'pussy', 'cock', 'fag', 'faggot', 'retard', 'nigger',
  'nigga', 'whore', 'slut', 'piss', 'crap', 'damn', 'bollocks',

  // Slurs
  'kike', 'spic', 'chink', 'wetback', 'tranny',

  // D3TX specific — anti-scam protection
  'scammer', 'scam', 'scamming', 'fake', 'fraud', 'liar', 'lying',
  'cheat', 'cheater', 'ripoff', 'rip off', 'ripped off', 'stole',
  'stolen', 'dont buy', "don't buy", 'avoid', 'beware', 'warning',
  'reported', 'report them', 'chargebacks', 'chargeback',

  // Abusive toward staff/service
  'trash service', 'worst service', 'garbage service', 'terrible service',
  'horrible service', 'shit service', 'dogshit', 'rubbish',
  'incompetent', 'useless', 'worthless',
];

// Phrases that need exact/partial match (more context-sensitive)
const BAD_PHRASES = [
  'd3tx scam',
  'd3tx fake',
  'd3tx fraud',
  'd3tx liar',
  'they scammed',
  'got scammed',
  'got ripped',
  'stay away from',
  'do not buy from',
  "don't buy from",
];

// ─────────────────────────────────────────────────────────────
// TIMEOUT ESCALATION SCALE
// Offense count → timeout duration in milliseconds
// ─────────────────────────────────────────────────────────────
const TIMEOUT_SCALE = {
  1: 10 * 60 * 1000,           // 1st offense: 10 minutes
  2: 30 * 60 * 1000,           // 2nd offense: 30 minutes
  3: 4 * 60 * 60 * 1000,       // 3rd offense: 4 hours
  4: 4 * 60 * 60 * 1000,       // 4th+ offense: 4 hours (always, no ban)
};

const TIMEOUT_LABELS = {
  1: '10 minutes',
  2: '30 minutes',
  3: '4 hours',
  4: '4 hours',
};

// In-memory offense tracker: userId -> offense count
// For persistence across restarts, this could be moved to a JSON file
const offenseTracker = new Map();

function getOffenseCount(userId) {
  return offenseTracker.get(userId) || 0;
}

function incrementOffense(userId) {
  const current = getOffenseCount(userId);
  const next = current + 1; // No cap — keeps counting forever
  offenseTracker.set(userId, next);
  return next;
}

function getTimeoutDuration(offenseCount) {
  return TIMEOUT_SCALE[Math.min(offenseCount, 4)]; // Max timeout is 4 hours (offense 3+)
}

function getTimeoutLabel(offenseCount) {
  return TIMEOUT_LABELS[Math.min(offenseCount, 4)];
}

// ─────────────────────────────────────────────────────────────
// REFUND KEYWORDS — hardcoded, always caught, no AI needed
// ─────────────────────────────────────────────────────────────
const REFUND_KEYWORDS = [
  'refund', 'refunded', 'refunding', 'refunds',
  'money back', 'my money back', 'get my money',
  'give me back', 'give back my', 'back my money',
  'back the money', 'return my money', 'return the money',
  'chargeback', 'charge back',
  'dispute', 'disputing', 'open a dispute',
  'paypal claim', 'paypal dispute',
  'return my payment', 'return payment',
  'want my money', 'give me my money',
  'i want my money', 'send my money',
  'pay me back', 'need my money',
  'where is my money', 'where my money',
];

function checkRefund(content) {
  const lower = content.toLowerCase();
  for (const keyword of REFUND_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { matched: true };
    }
  }
  return { matched: false };
}

function checkMessage(content) {
  const lower = content.toLowerCase();

  // Check bad words
  for (const word of BAD_WORDS) {
    // Word boundary check to avoid false positives like "classic" matching "ass"
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      return { matched: true, trigger: word };
    }
  }

  // Check bad phrases (no word boundary needed)
  for (const phrase of BAD_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      return { matched: true, trigger: phrase };
    }
  }

  return { matched: false, trigger: null };
}

module.exports = {
  BAD_WORDS,
  BAD_PHRASES,
  REFUND_KEYWORDS,
  TIMEOUT_SCALE,
  TIMEOUT_LABELS,
  offenseTracker,
  getOffenseCount,
  incrementOffense,
  getTimeoutDuration,
  getTimeoutLabel,
  checkMessage,
  checkRefund,
};
