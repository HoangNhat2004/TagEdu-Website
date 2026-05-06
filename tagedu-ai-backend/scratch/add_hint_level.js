const db = require('../config/db');

db.query("SHOW COLUMNS FROM chat_messages LIKE 'hint_level'", (err, rows) => {
  if (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
  if (rows.length > 0) {
    console.log('SKIP: hint_level column already exists');
    process.exit(0);
  }
  db.query(
    "ALTER TABLE chat_messages ADD COLUMN hint_level ENUM('none','conceptual','directional','syntax') DEFAULT 'none'",
    (alterErr) => {
      if (alterErr) {
        console.error('ERROR:', alterErr);
        process.exit(1);
      }
      console.log('OK: hint_level column added successfully');
      process.exit(0);
    }
  );
});
