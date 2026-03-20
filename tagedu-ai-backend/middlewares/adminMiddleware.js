const db = require('../config/db');

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [users] = await db.promise().query('SELECT role FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Truy cập bị từ chối. Khu vực chỉ dành cho Quản trị viên!' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Lỗi kiểm tra quyền hạn.' });
  }
};

module.exports = isAdmin;