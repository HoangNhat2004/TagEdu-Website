const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Lỗi kết nối cơ sở dữ liệu:', err.message);
  } else {
    console.log('✅ Đã kết nối thành công đến MySQL Database: tagedu_db 🎉');
    
    const createTestUser = `
      INSERT IGNORE INTO users (id, full_name, email, password_hash) 
      VALUES (1, 'Test User', 'test@tagedu.com', '$2b$10$X7...hash_gia...')
    `;
    connection.query(createTestUser, (err) => {
       if (err) console.error("Lỗi khi tạo user test:", err);
       else console.log("👤 Đã kiểm tra/khởi tạo tài khoản Test User (ID: 1) thành công.");
    });
    connection.release();
  }
});

module.exports = db;