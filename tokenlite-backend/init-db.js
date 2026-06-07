require('dotenv').config();
const { turso } = require('./lib/turso');

async function initDB() {
  try {
    console.log('Creating usage table...');
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS usage (
        uuid TEXT PRIMARY KEY,
        screenshot_count INTEGER DEFAULT 0
      )
    `);
    console.log('✅ Successfully created usage table!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

initDB();