require('dotenv').config();
const db = require('./config/db');

async function check() {
  const [rows] = await db.promise().query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5');
  console.log(rows);
  process.exit(0);
}
check();
