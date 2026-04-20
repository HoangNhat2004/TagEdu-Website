const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Đường dẫn tới file kết nối MySQL
const authenticateToken = require('../middlewares/authMiddleware'); // Đường dẫn tới file middleware kiểm tra token

// [MỚI] Tự động kiểm tra và thêm cột draft_data nếu chưa có
db.query("SHOW COLUMNS FROM user_progress LIKE 'draft_data'", (err, rows) => {
  if (!err && rows.length === 0) {
    db.query("ALTER TABLE user_progress ADD COLUMN draft_data LONGTEXT", (alterErr) => {
      if (alterErr) console.error("❌ Không thể thêm cột draft_data:", alterErr);
      else console.log("✅ Đã thêm cột draft_data vào bảng user_progress");
    });
  }
});

// [MỚI] Thiết lập ràng buộc DUY NHẤT cho (user_id, challenge_id) để tránh trùng lặp dữ liệu
db.query("SHOW INDEX FROM user_progress WHERE Key_name = 'user_challenge_unique'", (err, rows) => {
  if (!err && rows.length === 0) {
    // Trước khi thêm index, dọn dẹp các dòng trùng lặp nếu có (giữ lại dòng mới nhất)
    const cleanupQuery = `
      DELETE p1 FROM user_progress p1
      INNER JOIN user_progress p2 
      WHERE p1.id < p2.id 
      AND p1.user_id = p2.user_id 
      AND p1.challenge_id = p2.challenge_id
    `;
    db.query(cleanupQuery, (cleanErr) => {
      if (!cleanErr) {
        db.query("ALTER TABLE user_progress ADD UNIQUE INDEX user_challenge_unique (user_id, challenge_id)", (idxErr) => {
          if (idxErr) console.error("❌ Không thể tạo Unique Index:", idxErr);
          else console.log("✅ Đã tạo Unique Index thành công cho user_progress");
        });
      }
    });
  }
});

// ==========================================
// API: QUẢN LÝ TIẾN ĐỘ HỌC TẬP (PROGRESS)
// ==========================================

// 1. API Lấy tiến độ của một User (Dùng cho Trang chủ & Tải bản nháp)
router.get('/progress', authenticateToken, (req, res) => {
  const userId = req.user.id || req.user.userId; 

  if (!userId) {
    return res.status(400).json({ error: "Không tìm thấy thông tin user trong token" });
  }
  
  db.execute(
    'SELECT challenge_id, is_completed, completed_at, draft_data FROM user_progress WHERE user_id = ?',
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
  const userId = req.user.id || req.user.userId; 
  const { challengeId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Không tìm thấy thông tin user trong token" });
  }

  if (!challengeId) {
    return res.status(400).json({ error: "Thiếu challengeId" });
  }

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

// 3. [MỚI] API Lưu bản nháp (Draft) khi đang làm dở
router.post('/progress/draft', authenticateToken, (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { challengeId, draftData } = req.body;

  if (!userId || !challengeId) {
    return res.status(400).json({ error: "Thiếu thông tin để lưu bản nháp" });
  }

  // [SỬA] Cho phép lưu bản nháp ngay cả khi đã hoàn thành (để phục vụ việc luyện tập lại)
  // Nếu chưa có bản ghi -> INSERT mới với is_completed = 0
  // Nếu đã có bản ghi -> chỉ UPDATE draft_data (không ghi đè is_completed)
  const query = `
    INSERT INTO user_progress (user_id, challenge_id, is_completed, draft_data)
    VALUES (?, ?, 0, ?)
    ON DUPLICATE KEY UPDATE draft_data = ?
  `;

  db.execute(query, [userId, challengeId, draftData, draftData], (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi lưu bản nháp:", err);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu bản nháp" });
    }
    res.json({ message: "✅ Đã lưu bản nháp thành công!" });
  });
});

// 4. [MỚI] API Reset tiến độ - Làm lại từ đầu (Chỉ xóa draft, GIỮ NGUYÊN trạng thái đã hoàn thành)
router.post('/progress/reset', authenticateToken, (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { challengeId } = req.body;

  if (!userId || !challengeId) {
    return res.status(400).json({ error: "Thiếu thông tin để reset tiến độ" });
  }

  // [SỬA] Đặt về dữ liệu mặc định tùy theo loại thử thách để Frontend dễ dàng đồng bộ
  let resetData = '{}';
  if (challengeId === "challenge8") {
    resetData = JSON.stringify({ currentQ: 0, completed: false });
  }

  const query = `
    UPDATE user_progress 
    SET draft_data = ? 
    WHERE user_id = ? AND challenge_id = ?
  `;

  db.execute(query, [resetData, userId, challengeId], (err, results) => {
    if (err) {
      console.error("❌ Lỗi khi reset tiến độ:", err);
      return res.status(500).json({ error: "Lỗi máy chủ khi reset tiến độ" });
    }
    res.json({ message: "✅ Đã reset nháp thử thách thành công!", resetData });
  });
});

module.exports = router;