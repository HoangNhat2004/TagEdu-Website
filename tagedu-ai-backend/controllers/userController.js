const db = require('../config/db');

// Tự động nhận diện thư viện mã hóa
let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (err) {
  try {
    bcrypt = require('bcrypt');
  } catch (err2) {
    console.error("⚠️ CẢNH BÁO: Chưa cài thư viện mã hóa mật khẩu!");
  }
}

// 1. Cập nhật thông tin cá nhân (Tên hiển thị)
exports.updateProfile = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { full_name, language } = req.body;
  const lang = language || 'vi';

  if (!full_name || full_name.trim().length < 2) {
    return res.status(400).json({ error: lang === 'en' ? 'Display name must be at least 2 characters.' : 'Tên hiển thị phải có ít nhất 2 ký tự.' });
  }

  if (full_name.length > 100) {
    return res.status(400).json({ error: lang === 'en' ? 'Display name cannot exceed 100 characters.' : 'Tên hiển thị không được vượt quá 100 ký tự.' });
  }

  try {
    await db.promise().query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, userId]);
    res.json({ message: lang === 'en' ? 'Profile updated successfully!' : 'Cập nhật thông tin thành công!', full_name });
  } catch (error) {
    console.error("❌ Lỗi cập nhật Profile:", error);
    res.status(500).json({ error: lang === 'en' ? 'Server error while updating profile.' : 'Lỗi máy chủ khi cập nhật thông tin.' });
  }
};

// 2. Đổi mật khẩu an toàn
exports.changePassword = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { currentPassword, newPassword, language } = req.body;
  const lang = language || 'vi';

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: lang === 'en' ? 'Please enter both current and new password.' : 'Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: lang === 'en' ? 'New password must differ from current password.' : 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: lang === 'en' ? 'New password must be at least 6 characters.' : 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }

  if (!bcrypt) {
    return res.status(500).json({ error: lang === 'en' ? 'Server error: Missing encryption library.' : 'Lỗi server: Hệ thống thiếu thư viện mã hóa.' });
  }

  try {
    const [users] = await db.promise().query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: lang === 'en' ? 'User not found.' : 'Không tìm thấy người dùng.' });
    }

    const user = users[0];

    // Kiểm tra nếu tài khoản chưa có mật khẩu (Đăng nhập bằng Google)
    if (!user.password_hash) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
      
      return res.json({ message: lang === 'en' ? 'Password set successfully for your account!' : 'Đã thiết lập mật khẩu thành công cho tài khoản của bạn!' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: lang === 'en' ? 'Current password is incorrect.' : 'Mật khẩu hiện tại không đúng.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: lang === 'en' ? 'Password changed successfully! Please use your new password next time.' : 'Đổi mật khẩu thành công! Vui lòng dùng mật khẩu mới cho lần đăng nhập sau.' });
  } catch (error) {
    console.error("❌ Lỗi đổi mật khẩu:", error);
    res.status(500).json({ error: lang === 'en' ? 'Server error while changing password.' : 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
};

// 3. [MỚI] Lấy thống kê học tập (Learning Analytics)
exports.getUserAnalytics = async (req, res) => {
  const requesterId = req.user.id || req.user.userId;
  const { childId, language } = req.query;
  const lang = language || 'vi';

  let targetUserId = requesterId;

  try {
    // Nếu có childId, kiểm tra quyền của Phụ huynh
    if (childId) {
      const [childCheck] = await db.promise().query(
        'SELECT id FROM users WHERE id = ? AND parent_id = ?',
        [childId, requesterId]
      );
      if (childCheck.length === 0) {
        return res.status(403).json({ error: lang === 'en' ? 'Permission denied' : 'Không có quyền truy cập dữ liệu này' });
      }
      targetUserId = childId;
    }

    // 3a. Tổng số tin nhắn của học viên
    const [msgCount] = await db.promise().query(
      'SELECT COUNT(*) as total FROM chat_messages WHERE user_id = ? AND sender_role = ?',
      [targetUserId, 'user']
    );

    // 3b. Phân bổ hint_level từ tin nhắn của AI
    const [hintStats] = await db.promise().query(
      `SELECT hint_level, COUNT(*) as count 
       FROM chat_messages 
       WHERE user_id = ? AND sender_role = 'ai' AND hint_level IS NOT NULL AND hint_level != 'none'
       GROUP BY hint_level`,
      [targetUserId]
    );

    // 3c. Danh sách thử thách đã hoàn thành
    const [completedChallenges] = await db.promise().query(
      `SELECT challenge_id, completed_at 
       FROM user_progress 
       WHERE user_id = ? AND is_completed = 1
       ORDER BY completed_at ASC`,
      [targetUserId]
    );

    // 3d. Tổng số thử thách
    const [totalChallenges] = await db.promise().query(
      'SELECT COUNT(DISTINCT challenge_id) as total FROM user_progress WHERE user_id = ?',
      [targetUserId]
    );

    // 3e. Thông tin người dùng
    const [userInfo] = await db.promise().query(
      'SELECT full_name, date_of_birth FROM users WHERE id = ?',
      [targetUserId]
    );

    // Tính tuổi
    let age = null;
    let ageBand = null;
    if (userInfo[0]?.date_of_birth) {
      const dob = new Date(userInfo[0].date_of_birth);
      const now = new Date();
      age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
      if (age >= 5 && age <= 8) ageBand = '5-8';
      else if (age >= 9 && age <= 12) ageBand = '9-12';
      else if (age >= 13) ageBand = '13+';
    }

    // Chuẩn hóa hint stats
    const hintDistribution = {
      conceptual: 0,
      directional: 0,
      syntax: 0,
    };
    hintStats.forEach(row => {
      if (hintDistribution.hasOwnProperty(row.hint_level)) {
        hintDistribution[row.hint_level] = row.count;
      }
    });
    const totalHints = hintDistribution.conceptual + hintDistribution.directional + hintDistribution.syntax;

    res.json({
      totalMessages: msgCount[0].total,
      hintDistribution,
      totalHints,
      completedChallenges: completedChallenges.map(c => ({
        challengeId: c.challenge_id,
        completedAt: c.completed_at,
      })),
      completedCount: completedChallenges.length,
      totalChallengesAttempted: totalChallenges[0].total,
      age,
      ageBand,
      fullName: userInfo[0]?.full_name || '',
    });
  } catch (error) {
    console.error("❌ Lỗi lấy analytics:", error);
    res.status(500).json({ error: lang === 'en' ? 'Server error while loading analytics.' : 'Lỗi máy chủ khi tải thống kê.' });
  }
};

// 4. [MỚI] Cập nhật ngày sinh (Onboarding)
exports.updateDateOfBirth = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { dateOfBirth, language } = req.body;
  const lang = language || 'vi';

  if (!dateOfBirth) {
    return res.status(400).json({ error: lang === 'en' ? 'Please enter your date of birth.' : 'Vui lòng nhập ngày sinh.' });
  }

  // Validate ngày sinh hợp lệ
  const dob = new Date(dateOfBirth);
  const now = new Date();

  if (isNaN(dob.getTime())) {
    return res.status(400).json({ error: lang === 'en' ? 'Invalid date of birth.' : 'Ngày sinh không hợp lệ.' });
  }

  if (dob > now) {
    return res.status(400).json({ error: lang === 'en' ? 'Date of birth cannot be in the future.' : 'Ngày sinh không thể ở tương lai.' });
  }

  try {
    // Lấy role của người dùng để validate tuổi phù hợp
    const [user] = await db.promise().query('SELECT role FROM users WHERE id = ?', [userId]);
    if (!user.length) return res.status(404).json({ error: 'User not found' });
    const userRole = user[0].role;

    // Kiểm tra tuổi hợp lệ dựa trên Role
    const age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (userRole === 'learner') {
      if (age < 5 || age > 18) {
        return res.status(400).json({ 
          error: lang === 'en' 
            ? 'Learner age must be between 5 and 18 years old.' 
            : 'Học sinh phải nằm trong độ tuổi từ 5 đến 18 tuổi.' 
        });
      }
    } else if (userRole === 'guardian') {
      if (age < 18) {
        return res.status(400).json({ 
          error: lang === 'en' 
            ? 'Guardian must be at least 18 years old.' 
            : 'Phụ huynh/Giáo viên phải từ 18 tuổi trở lên.' 
        });
      }
      if (age > 100) {
        return res.status(400).json({ error: lang === 'en' ? 'Please enter a valid date of birth.' : 'Vui lòng nhập ngày sinh hợp lệ.' });
      }
    }

    // Lưu dạng YYYY-MM-DD
    const dobStr = dob.toISOString().split('T')[0];
    await db.promise().query('UPDATE users SET date_of_birth = ? WHERE id = ?', [dobStr, userId]);

    res.json({ 
      message: lang === 'en' ? 'Date of birth saved successfully!' : 'Đã lưu ngày sinh thành công!', 
      dateOfBirth: dobStr 
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật ngày sinh:", error);
    res.status(500).json({ error: lang === 'en' ? 'Server error while saving date of birth.' : 'Lỗi máy chủ khi lưu ngày sinh.' });
  }
};