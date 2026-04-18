const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'auth.loginRequired' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ error: 'auth.sessionExpired' });
    
    try {
      // Kiểm tra user có thực sự còn tồn tại trong DB không (tránh Zombie Session)
      const [rows] = await db.promise().query('SELECT id FROM users WHERE id = ?', [user.userId]);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'auth.sessionExpired' });
      }
      
      req.user = user; 
      next(); 
    } catch (dbErr) {
      console.error('Lỗi kiểm tra user trong authMiddleware:', dbErr);
      res.status(500).json({ error: 'Lỗi hệ thống khi xác thực.' });
    }
  });
};

module.exports = authenticateToken;