require('dotenv').config();
const { turso } = require('../lib/turso');

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uuid } = req.query || {};

    if (!uuid) {
      return res.status(400).json({ error: 'Missing uuid' });
    }

    const usageResult = await turso.execute({
      sql: 'SELECT screenshot_count FROM usage WHERE uuid = ?',
      args: [uuid]
    });

    const screenshotsUsed = usageResult.rows.length > 0
      ? usageResult.rows[0].screenshot_count
      : 0;

    return res.status(200).json({
      count: screenshotsUsed,
      screenshots_used: screenshotsUsed,
      screenshots_remaining: Math.max(0, 5 - screenshotsUsed)
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
