const admin = require('./_firebase');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secretcol18';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, action, query, keys: blockKeys } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Wrong password' });
  }

  const db = admin.firestore();

  try {
    if (action === 'stats') {
      const usersSnap = await db.collection('users').get();
      let totalOpens = 0, totalWins = 0;
      const users = [];
      usersSnap.forEach(doc => {
        const d = doc.data();
        totalOpens += d.opens || 0;
        totalWins += d.wins || 0;
        users.push({ id: doc.id, ...d });
      });
      const usedSnap = await db.collection('usedKeys').get();
      return res.json({ totalUsers: users.length, totalOpens, totalWins, totalKeysUsed: usedSnap.size, users });
    }

    if (action === 'activity') {
      const actSnap = await db.collection('activity').orderBy('time', 'desc').limit(200).get();
      const activity = [];
      actSnap.forEach(doc => activity.push(doc.data()));
      return res.json({ activity });
    }

    if (action === 'search') {
      if (!query) return res.status(400).json({ error: 'Missing query' });
      const q = query.toLowerCase();
      const usersSnap = await db.collection('users').get();
      const matches = [];
      usersSnap.forEach(doc => {
        const d = doc.data();
        if (doc.id.toLowerCase().includes(q) ||
            (d.globalName && d.globalName.toLowerCase().includes(q)) ||
            (d.discordId && d.discordId.includes(q))) {
          matches.push({ id: doc.id, ...d });
        }
      });

      for (const user of matches) {
        const actSnap = await db.collection('activity')
          .where('user', '==', user.id)
          .orderBy('time', 'desc').limit(50).get();
        user.history = [];
        actSnap.forEach(doc => user.history.push(doc.data()));
      }
      return res.json({ matches });
    }

    if (action === 'allWins') {
      const actSnap = await db.collection('activity')
        .where('isWin', '==', true)
        .orderBy('time', 'desc').get();
      const wins = [];
      actSnap.forEach(doc => wins.push(doc.data()));
      return res.json({ wins });
    }

    if (action === 'blockKeys') {
      if (!blockKeys || !Array.isArray(blockKeys)) return res.status(400).json({ error: 'Missing keys' });
      let blocked = 0;
      const batch = db.batch();
      for (const key of blockKeys) {
        const upperKey = key.trim().toUpperCase();
        if (!upperKey.startsWith('PRINCE-')) continue;
        batch.set(db.collection('usedKeys').doc(upperKey), {
          usedBy: 'admin-blocked', usedAt: Date.now(), caseType: 'manual'
        });
        blocked++;
      }
      await batch.commit();
      return res.json({ blocked, message: `${blocked} keys blocked` });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('Admin error:', e);
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
};
