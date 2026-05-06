const db = require('../config/db');

// 1. Lấy thống kê tổng quan (Admin Dashboard Stats)
exports.getDashboardStats = async (req, res) => {
  try {
    const [[learnerCount]] = await db.promise().query("SELECT COUNT(*) as total FROM users WHERE role = 'learner'");
    const [[guardianCount]] = await db.promise().query("SELECT COUNT(*) as total FROM users WHERE role = 'guardian'");
    const [[messageCount]] = await db.promise().query("SELECT COUNT(*) as total FROM chat_messages WHERE sender_role = 'user'");
    
    res.json({ 
      totalLearners: learnerCount.total, 
      totalGuardians: guardianCount.total,
      totalMessages: messageCount.total 
    });
  } catch (error) {
    console.error("❌ Lỗi dashboard stats:", error);
    res.status(500).json({ error: 'Lỗi lấy thống kê.' });
  }
};

// 2. Lấy danh sách toàn bộ người dùng
exports.getAllUsers = async (req, res) => {
  try {
    // Thêm trường guardian_name bằng cách SELF JOIN
    const query = `
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.role, 
        u.created_at,
        u.date_of_birth,
        p_user.full_name as guardian_name,
        COUNT(DISTINCT m.id) as message_count,
        COUNT(DISTINCT p.challenge_id) as completed_challenges
      FROM users u
      LEFT JOIN users p_user ON u.parent_id = p_user.id
      LEFT JOIN chat_messages m ON u.id = m.user_id AND m.sender_role = 'user'
      LEFT JOIN user_progress p ON u.id = p.user_id AND p.is_completed = 1
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const [users] = await db.promise().query(query);
    res.json(users);
  } catch (error) {
    console.error("❌ Lỗi getAllUsers:", error);
    res.status(500).json({ error: 'Lỗi lấy danh sách người dùng.' });
  }
};

// 3. Lấy lịch sử chat
exports.getUserChatLogs = async (req, res) => {
  const { id } = req.params;
  
  try {
    // [ĐÃ SỬA] Đọc đúng cột sender_role từ Database của bạn và đổi tên thành 'role' cho Frontend dễ nhận
    // [MỚI] Thêm cột hint_level để hiển thị cấp độ gợi ý trên Admin Dashboard
    const query = `
      SELECT 
        id, 
        sender_role as role, 
        content, 
        feedback,
        hint_level,
        challenge_id,
        created_at 
      FROM chat_messages 
      WHERE user_id = ? 
      ORDER BY created_at ASC
    `;
    const [logs] = await db.promise().query(query, [id]);
    res.json(logs);
  } catch (error) {
    console.error('❌ Lỗi khi lấy lịch sử chat:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy lịch sử chat của học viên.' });
  }
};

// 4. Xóa người dùng
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM chat_messages WHERE user_id = ?', [id]);
    await db.promise().query('DELETE FROM user_progress WHERE user_id = ?', [id]);
    await db.promise().query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa người dùng và dữ liệu liên quan thành công.' });
  } catch (error) {
    console.error("❌ Lỗi deleteUser:", error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa người dùng.' });
  }
};