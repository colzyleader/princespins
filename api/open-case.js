const admin = require('./_firebase');
const keys = require('./_keys.json');

const cases = {
  garama: {
    name: '🔥 Garama',
    items: [
      { name: 'BASE GARAMA 50M', emoji: '🔥', rarity: 'epic', chance: 5, color: '#c084fc' },
      { name: 'NOTHING', emoji: '💨', rarity: 'common', chance: 95, color: '#6b7280' },
    ]
  },
  dragon: {
    name: '🐉 Dragon Canneloni',
    items: [
      { name: 'DRAGON CANNELONI', emoji: '🐉', rarity: 'legendary', chance: 2, color: '#fbbf24' },
      { name: 'NOTHING', emoji: '💨', rarity: 'common', chance: 98, color: '#6b7280' },
    ]
  },
  rarity: {
    name: '🧠 Brainrot Wheel',
    items: [
      { name: 'SECRET BRAINROT', emoji: '🌟', rarity: 'secret', chance: 2, color: '#fb7185' },
      { name: 'EPIC BRAINROT', emoji: '💎', rarity: 'epic', chance: 8, color: '#c084fc' },
      { name: 'RARE BRAINROT', emoji: '⚡', rarity: 'rare', chance: 15, color: '#60a5fa' },
      { name: 'UNCOMMON BRAINROT', emoji: '🧩', rarity: 'uncommon', chance: 25, color: '#22d3ee' },
      { name: 'COMMON BRAINROT', emoji: '📦', rarity: 'common', chance: 50, color: '#9ca3af' },
    ]
  }
};

function pickItem(items) {
  const rand = Math.random() * 100;
  let cum = 0;
  for (const item of items) {
    cum += item.chance;
    if (rand <= cum) return item;
  }
  return items[items.length - 1];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key, caseType, user, discordId, avatar, globalName } = req.body;
  if (!key || !caseType) return res.status(400).json({ error: 'Missing key or caseType' });

  const upperKey = key.trim().toUpperCase();
  const caseData = cases[caseType];
  if (!caseData) return res.status(400).json({ error: 'Invalid case type' });

  const validKeys = keys[caseType];
  if (!validKeys || !validKeys.includes(upperKey)) {
    return res.status(400).json({ error: 'Invalid key' });
  }

  const db = admin.firestore();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const keyRef = db.collection('usedKeys').doc(upperKey);
      const userRef = user ? db.collection('users').doc(user) : null;
      
      // ALL READS FIRST
      const keyDoc = await transaction.get(keyRef);
      const userDoc = userRef ? await transaction.get(userRef) : null;

      if (keyDoc.exists) {
        throw new Error('KEY_USED');
      }

      // Roll result server-side
      const item = pickItem(caseData.items);
      const isWin = item.rarity !== 'common';

      // ALL WRITES AFTER READS
      // Mark key as used
      transaction.set(keyRef, {
        usedBy: user || 'unknown',
        discordId: discordId || null,
        usedAt: Date.now(),
        caseType: caseType
      });

      // Log activity
      const actRef = db.collection('activity').doc();
      transaction.set(actRef, {
        user: user || 'unknown',
        discordId: discordId || null,
        avatar: avatar || null,
        globalName: globalName || user || 'unknown',
        caseName: caseData.name,
        item: item.name,
        rarity: item.rarity,
        isWin: isWin,
        key: upperKey,
        time: Date.now()
      });

      // Update user stats
      if (user && userRef) {
        if (userDoc.exists) {
          const d = userDoc.data();
          transaction.update(userRef, {
            opens: (d.opens || 0) + 1,
            wins: (d.wins || 0) + (isWin ? 1 : 0),
            lastActive: Date.now()
          });
        } else {
          transaction.set(userRef, {
            joined: Date.now(),
            opens: 1,
            wins: isWin ? 1 : 0,
            discordId: discordId || null,
            avatar: avatar || null,
            globalName: globalName || user,
            lastActive: Date.now()
          });
        }
      }

      return item;
    });

    return res.json({ success: true, item: result, caseName: caseData.name });
  } catch (e) {
    if (e.message === 'KEY_USED') {
      return res.status(400).json({ error: 'Key already used' });
    }
    console.error('Transaction error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
