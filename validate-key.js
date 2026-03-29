const admin = require('./_firebase');
const keys = require('./_keys.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key, caseType } = req.body;
  if (!key || !caseType) return res.status(400).json({ error: 'Missing key or caseType' });

  const upperKey = key.trim().toUpperCase();
  const validKeys = keys[caseType];
  if (!validKeys) return res.status(400).json({ error: 'Invalid case type' });

  const labels = { garama: 'Base Garama', dragon: 'Dragon Canneloni', rarity: 'Brainrot Wheel' };

  for (const [ct, ks] of Object.entries(keys)) {
    if (ct !== caseType && ks.includes(upperKey)) {
      return res.json({ valid: false, reason: 'Wrong case — this key is for ' + labels[ct] });
    }
  }

  if (!validKeys.includes(upperKey)) {
    return res.json({ valid: false, reason: 'Invalid key' });
  }

  const db = admin.firestore();
  const doc = await db.collection('usedKeys').doc(upperKey).get();
  if (doc.exists) {
    return res.json({ valid: false, reason: 'Key already used' });
  }

  return res.json({ valid: true, key: upperKey });
};
