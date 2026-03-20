const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Đường dẫn tới file kết nối MySQL
const authenticateToken = require('../middlewares/authMiddleware'); // Đường dẫn tới file middleware kiểm tra token

// ==========================================
// API: QUẢN LÝ TIẾN ĐỘ HỌC TẬP (PROGRESS)
// ==========================================

// 1. API Lấy tiến độ của một User (Dùng cho Trang chủ)
router.get('/progress', authenticateToken, (req, res) => {
  // Bọc lót: Hỗ trợ cả trường hợp token lưu là id hoặc userId
  const userId = req.user.id || req.user.userId; 

  if (!userId) {
    return res.status(400).json({ error: "Không tìm thấy thông tin user trong token" });
  }
  
  db.execute(
    'SELECT challenge_id, is_completed, completed_at FROM user_progress WHERE user_id = ?',
    [userId],
    (err, rows) => {
      if (err) {
        console.error("❌ Lỗi khi lấy tiến độ:", err);
        return res.status(500).json({ error: "Lỗi máy chủ khi lấy tiến độ" });
      }
      res.json(rows);
    }
  );
});

// 2. API Lưu/Cập nhật tiến độ khi làm xong Thử thách
router.post('/progress/complete', authenticateToken, (req, res) => {
  // Bọc lót: Hỗ trợ cả trường hợp token lưu là id hoặc userId
  const userId = req.user.id || req.user.userId; 
  const { challengeId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Không tìm thấy thông tin user trong token" });
  }

  if (!challengeId) {
    return res.status(400).json({ error: "Thiếu challengeId" });
  }

  // Dùng INSERT ... ON DUPLICATE KEY UPDATE
  const query = `
    INSERT INTO user_progress (user_id, challenge_id, is_completed, completed_at)
    VALUES (?, ?, 1, NOW())
    ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = NOW()
  `;

  db.execute(query, [userId, challengeId], (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi cập nhật tiến độ:", err);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu tiến độ" });
    }
    res.json({ message: "✅ Đã lưu tiến độ thành công!" });
  });
});

module.exports = router;