const admin = require('./_firebase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = admin.firestore();
  try {
    const actSnap = await db.collection('activity').orderBy('time', 'desc').limit(50).get();
    const activity = [];
    actSnap.forEach(doc => activity.push(doc.data()));

    const usersSnap = await db.collection('users').get();
    let totalOpens = 0, totalWins = 0, totalUsers = 0;
    usersSnap.forEach(doc => {
      const d = doc.data();
      totalOpens += d.opens || 0;
      totalWins += d.wins || 0;
      totalUsers++;
    });

    const usedSnap = await db.collection('usedKeys').get();

    return res.json({
      activity,
      stats: { totalOpens, totalWins, totalUsers, totalKeysUsed: usedSnap.size }
    });
  } catch (e) {
    console.error('Activity error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
