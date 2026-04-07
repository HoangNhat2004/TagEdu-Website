const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  const { fullName, email, password, language } = req.body;
  const lang = language || 'vi';
  if (!fullName || !email || !password) return res.status(400).json({ error: lang === 'en' ? 'Please fill in all fields!' : 'Vui lòng điền đầy đủ thông tin!' });

  try {
    const [existingUsers] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) return res.status(400).json({ error: lang === 'en' ? 'This email is already in use!' : 'Email này đã được sử dụng!' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, email, passwordHash]
    );

    res.status(201).json({ message: lang === 'en' ? 'Registration successful!' : 'Đăng ký tài khoản thành công!', user: { id: result.insertId, fullName: fullName, email: email, role: 'user' } });
  } catch (error) {
    res.status(500).json({ error: lang === 'en' ? 'System error during registration.' : 'Lỗi hệ thống khi đăng ký.' });
  }
};

exports.login = async (req, res) => {
  const { email, password, language } = req.body;
  const lang = language || 'vi';
  if (!email || !password) return res.status(400).json({ error: lang === 'en' ? 'Please enter email and password!' : 'Vui lòng nhập email và mật khẩu!' });

  try {
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: lang === 'en' ? 'Incorrect email or password!' : 'Email hoặc mật khẩu không chính xác!' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: lang === 'en' ? 'Incorrect email or password!' : 'Email hoặc mật khẩu không chính xác!' });

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: lang === 'en' ? 'Login successful!' : 'Đăng nhập thành công!', token, user: { id: user.id, fullName: user.full_name, email: user.email, profileBio: user.profile_bio, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: lang === 'en' ? 'System error during login.' : 'Lỗi hệ thống khi đăng nhập.' });
  }
};

exports.googleLogin = async (req, res) => {
  const { credential, language } = req.body;
  const lang = language || 'vi';
  if (!credential) return res.status(400).json({ error: lang === 'en' ? 'Missing Google authentication token!' : 'Thiếu mã xác thực từ Google!' });

  try {
    let email, name;

    // Try ID token verification first (old GoogleLogin component)
    // If it fails, treat credential as an access_token (useGoogleLogin hook)
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } catch {
      // Credential is an access_token — fetch user info from Google API
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` },
      });
      if (!googleRes.ok) throw new Error('Invalid access token');
      const userInfo = await googleRes.json();
      email = userInfo.email;
      name = userInfo.name;
    }

    if (!email) throw new Error('No email from Google');

    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length === 0) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const [result] = await db.promise().query(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
      );
      user = { id: result.insertId, full_name: name, email: email, profile_bio: null, role: 'user' }; 
    } else {
      user = users[0];
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: lang === 'en' ? 'Google login successful!' : 'Đăng nhập Google thành công!', token, user: { id: user.id, fullName: user.full_name, email: user.email, profileBio: user.profile_bio, role: user.role } });
  } catch (error) {
    console.error("Google login error:", error.message);
    res.status(500).json({ error: lang === 'en' ? 'Google authentication failed.' : 'Xác thực Google thất bại.' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, language } = req.body;
  const lang = language || 'vi';
  if (!email) return res.status(400).json({ error: lang === 'en' ? 'Please enter your email!' : 'Vui lòng nhập email!' });

  try {
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: lang === 'en' ? 'No account found with this email!' : 'Không tìm thấy tài khoản với email này!' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.promise().query(
      'UPDATE users SET reset_otp = ?, reset_otp_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email = ?',
      [otp, email]
    );

    // GỬI EMAIL BẰNG NODEMAILER (đáng tin cậy hơn Google Apps Script)
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // ENFORCE IPv4 (fixes ENETUNREACH 2404:... on Render)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Chọn nội dung theo ngôn ngữ
    const subject = lang === 'en' 
      ? 'OTP Reset Password - TagEdu' 
      : 'Mã OTP Đặt lại mật khẩu - TagEdu';

    const greeting = lang === 'en' ? 'Hi there,' : 'Chào bạn,';
    const mainText = lang === 'en' 
      ? 'You have requested to reset your password. Here is your OTP code (valid for 15 minutes):' 
      : 'Bạn vừa yêu cầu đặt lại mật khẩu. Dưới đây là mã OTP của bạn (có hiệu lực trong 15 phút):';
    const ignoreText = lang === 'en' 
      ? 'If you did not request this, please ignore this email.' 
      : 'Nếu bạn không yêu cầu, vui lòng bỏ qua email này.';

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#0d1117;padding:40px;border-radius:16px;">
        <h2 style="color:#00d4ff;text-align:center;margin-bottom:8px;">TagEdu AI</h2>
        <p style="color:#c9d1d9;text-align:center;">${greeting}</p>
        <p style="color:#c9d1d9;text-align:center;">${mainText}</p>
        <div style="background:#161b22;padding:24px;text-align:center;border-radius:12px;margin:24px 0;border:1px solid rgba(0,212,255,0.2);">
          <h1 style="color:#00d4ff;letter-spacing:12px;font-size:36px;margin:0;">${otp}</h1>
        </div>
        <p style="color:#8b949e;text-align:center;font-size:14px;">${ignoreText}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"TagEdu Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlBody,
    });

    console.log(`✅ OTP email sent to ${email} (lang: ${lang})`);
    res.json({ message: lang === 'en' ? 'OTP has been sent to your email!' : 'Đã gửi mã OTP đến email của bạn!' });
  } catch (error) {
    console.error("Lỗi gửi email OTP:", error.message);
    res.status(500).json({ error: lang === 'en' ? 'System error while sending email.' : 'Lỗi hệ thống khi gửi email.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, language } = req.body;
  const lang = language || 'vi';
  if (!email || !otp || !newPassword) return res.status(400).json({ error: lang === 'en' ? 'Please fill in all fields!' : 'Vui lòng điền đầy đủ thông tin!' });

  try {
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expiry > NOW()',
      [email, otp]
    );

    if (users.length === 0) return res.status(400).json({ error: lang === 'en' ? 'Invalid or expired OTP code!' : 'Mã OTP không hợp lệ hoặc đã hết hạn!' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.promise().query(
      'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?',
      [passwordHash, email]
    );

    res.json({ message: lang === 'en' ? 'Password changed successfully! You can log in now.' : 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.' });
  } catch (error) {
    res.status(500).json({ error: lang === 'en' ? 'System error while changing password.' : 'Lỗi hệ thống khi đổi mật khẩu.' });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.userId; 
  const { fullName, profileBio, language } = req.body; 
  const lang = language || 'vi';

  if (!fullName) return res.status(400).json({ error: lang === 'en' ? 'Display name cannot be empty!' : 'Tên hiển thị không được để trống!' });

  try {
    await db.promise().query('UPDATE users SET full_name = ?, profile_bio = ? WHERE id = ?', [fullName, profileBio, userId]);

    const [users] = await db.promise().query('SELECT id, full_name, email, profile_bio, role FROM users WHERE id = ?', [userId]);

    res.json({ 
      message: lang === 'en' ? 'Profile updated successfully!' : 'Cập nhật hồ sơ thành công!', 
      user: { id: users[0].id, fullName: users[0].full_name, email: users[0].email, profileBio: users[0].profile_bio, role: users[0].role } 
    });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    res.status(500).json({ error: lang === 'en' ? 'System error while updating profile.' : 'Lỗi hệ thống khi cập nhật hồ sơ.' });
  }
};