const admin = require('./_firebase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, discordId, avatar, globalName } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const db = admin.firestore();
  try {
    const userRef = db.collection('users').doc(username);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        joined: Date.now(), opens: 0, wins: 0,
        discordId: discordId || null, avatar: avatar || null,
        globalName: globalName || username, lastActive: Date.now()
      });
    } else {
      await userRef.update({
        discordId: discordId || null, avatar: avatar || null,
        globalName: globalName || username, lastActive: Date.now()
      });
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
