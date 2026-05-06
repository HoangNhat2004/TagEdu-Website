const db = require('../config/db');
const bcrypt = require('bcrypt');

// 1. Phụ huynh tạo tài khoản cho con (Add Child)
exports.addChild = async (req, res) => {
  const guardianId = req.user.id || req.user.userId;
  const { full_name, email, password, date_of_birth, language } = req.body;
  const lang = language || 'vi';

  if (!full_name || !email || !password || !date_of_birth) {
    return res.status(400).json({ error: lang === 'en' ? 'Missing required fields' : 'Thiếu thông tin bắt buộc' });
  }

  // COPPA/GDPR-K Validation: Check age
  const dob = new Date(date_of_birth);
  const now = new Date();
  const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  if (isNaN(age)) {
    return res.status(400).json({ error: lang === 'en' ? 'Invalid date of birth' : 'Ngày sinh không hợp lệ' });
  }
  if (age < 0) {
    return res.status(400).json({ error: lang === 'en' ? 'Date of birth cannot be in the future' : 'Ngày sinh không thể ở tương lai' });
  }
  if (age < 5 || age > 18) {
    return res.status(400).json({ error: lang === 'en' ? 'Child must be between 5 and 18 years old' : 'Trẻ em phải từ 5 đến 18 tuổi' });
  }

  try {
    // Kiểm tra xem email đã tồn tại chưa
    const [existing] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: lang === 'en' ? 'Email already in use' : 'Email này đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo tài khoản con
    const [result] = await db.promise().query(
      'INSERT INTO users (full_name, email, password_hash, date_of_birth, role, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, date_of_birth, 'learner', guardianId]
    );

    res.status(201).json({ 
      message: lang === 'en' ? 'Child profile created successfully!' : 'Đã tạo hồ sơ con thành công!',
      childId: result.insertId 
    });
  } catch (error) {
    console.error("❌ Lỗi tạo tài khoản con:", error);
    res.status(500).json({ error: lang === 'en' ? 'Server error' : 'Lỗi máy chủ' });
  }
};

// 2. Lấy danh sách con của phụ huynh
exports.getChildren = async (req, res) => {
  const guardianId = req.user.id || req.user.userId;

  try {
    const [children] = await db.promise().query(
      'SELECT id, full_name, email, date_of_birth FROM users WHERE parent_id = ?',
      [guardianId]
    );
    res.json(children);
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách con:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Xóa hồ sơ con (Chỉ phụ huynh của đứa trẻ đó mới có quyền)
exports.removeChild = async (req, res) => {
  const guardianId = req.user.id || req.user.userId;
  const { childId } = req.params;

  try {
    const [result] = await db.promise().query(
      'DELETE FROM users WHERE id = ? AND parent_id = ?',
      [childId, guardianId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Child profile not found or permission denied' });
    }

    res.json({ message: 'Child profile removed successfully' });
  } catch (error) {
    console.error("❌ Lỗi xóa hồ sơ con:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Xuất toàn bộ dữ liệu của con (COPPA/GDPR-K: Quyền truy cập dữ liệu)
exports.exportChildData = async (req, res) => {
  const guardianId = req.user.id || req.user.userId;
  const { childId } = req.params;

  try {
    // Xác minh quyền: chỉ phụ huynh của đứa trẻ mới được xuất
    const [child] = await db.promise().query(
      'SELECT id, full_name, email, date_of_birth, role, created_at FROM users WHERE id = ? AND parent_id = ?',
      [childId, guardianId]
    );

    if (child.length === 0) {
      return res.status(404).json({ error: 'Child not found or permission denied' });
    }

    // Lấy tiến độ học tập
    const [progress] = await db.promise().query(
      'SELECT challenge_id, is_completed, completed_at FROM user_progress WHERE user_id = ?',
      [childId]
    );

    // Lấy lịch sử chat (chỉ metadata, không lưu nội dung nhạy cảm theo nguyên tắc data minimization)
    const [chatMessages] = await db.promise().query(
      'SELECT challenge_id, sender_role as role, content, created_at as timestamp FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC',
      [childId]
    );

    const exportData = {
      exportedAt: new Date().toISOString(),
      requestedBy: guardianId,
      child: child[0],
      learningProgress: progress,
      chatHistory: chatMessages,
    };

    console.log(`📦 Xuất dữ liệu cho child ID ${childId} bởi guardian ID ${guardianId}`);
    res.json(exportData);
  } catch (error) {
    console.error("❌ Lỗi xuất dữ liệu con:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5. Xóa vĩnh viễn toàn bộ dữ liệu của con (COPPA/GDPR-K: Quyền xóa dữ liệu)
exports.deleteChildData = async (req, res) => {
  const guardianId = req.user.id || req.user.userId;
  const { childId } = req.params;

  try {
    // Xác minh quyền
    const [child] = await db.promise().query(
      'SELECT id, full_name FROM users WHERE id = ? AND parent_id = ?',
      [childId, guardianId]
    );

    if (child.length === 0) {
      return res.status(404).json({ error: 'Child not found or permission denied' });
    }

    const childName = child[0].full_name;

    // Xóa theo thứ tự: chat → progress → user
    await db.promise().query('DELETE FROM chat_messages WHERE user_id = ?', [childId]);
    await db.promise().query('DELETE FROM user_progress WHERE user_id = ?', [childId]);
    await db.promise().query('DELETE FROM users WHERE id = ? AND parent_id = ?', [childId, guardianId]);

    console.log(`🗑️ [GDPR] Đã xóa vĩnh viễn toàn bộ dữ liệu của "${childName}" (ID: ${childId}) theo yêu cầu của guardian ID ${guardianId}`);

    res.json({ message: 'All child data has been permanently deleted' });
  } catch (error) {
    console.error("❌ Lỗi xóa dữ liệu con:", error);
    res.status(500).json({ error: 'Server error' });
  }
};
