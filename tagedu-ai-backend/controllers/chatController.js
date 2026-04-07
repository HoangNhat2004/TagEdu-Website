const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryGeminiError = (error) => {
  const status = Number(error?.status);
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const streamGeminiWithRetry = async (chat, message, maxRetries = 2) => {
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      return await chat.sendMessageStream(message);
    } catch (error) {
      lastError = error;
      if (!shouldRetryGeminiError(error) || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 600ms, 1200ms, ...
      const delayMs = 600 * Math.pow(2, attempt);
      await sleep(delayMs);
      attempt += 1;
    }
  }

  throw lastError;
};

exports.getChatHistory = async (req, res) => {
  const userId = req.user.userId; 
  const { challengeId, sessionId = 'default_session' } = req.query;
  if (!challengeId) return res.status(400).json({ error: 'Thiếu thông tin challengeId' });

  try {
    const [rows] = await db.promise().query(
      'SELECT id, sender_role as role, content, feedback FROM chat_messages WHERE user_id = ? AND challenge_id = ? AND session_id = ? ORDER BY created_at ASC',
      [userId, challengeId, sessionId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Đã có lỗi xảy ra khi lấy dữ liệu.' });
  }
};

exports.saveFeedback = async (req, res) => {
  const userId = req.user.userId;
  const { messageId, feedback } = req.body;
  if (!messageId) return res.status(400).json({ error: 'Thiếu messageId' });

  try {
    await db.promise().query(
      'UPDATE chat_messages SET feedback = ? WHERE id = ? AND user_id = ?',
      [feedback, messageId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lưu feedback.' });
  }
};

exports.deleteChatSession = async (req, res) => {
  const userId = req.user.userId;
  const { challengeId, sessionId = 'default_session' } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'Thiếu thông tin challengeId' });

  try {
    await db.promise().query(
      'DELETE FROM chat_messages WHERE user_id = ? AND challenge_id = ? AND session_id = ?',
      [userId, challengeId, sessionId]
    );
    res.json({ success: true, message: 'Đã xóa phiên chat thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa dữ liệu chat.' });
  }
};

exports.handleChat = async (req, res) => {
  const userId = req.user.userId;
  const { challengeId = 'landing', sessionId = 'default_session', message, language = 'vi' } = req.body;
  if (!message) return res.status(400).json({ error: 'Thiếu tin nhắn từ người dùng' });

  let challengeContext = "";
  let systemInstruction = "";

  if (language === 'en') {
    // English system prompt
    if (challengeId === "challenge7") {
      challengeContext = "The student is working on Challenge 1: Software Classification. The task requires the student to distinguish and sort software (such as Windows, Word, Excel, Chrome, WinRAR...) into 3 groups: System Software, Application Software, and Utility Software. If the student asks about a specific software, guide them to analyze its purpose so they can figure out the correct group themselves.";
    } else if (challengeId === "challenge8") {
      challengeContext = "The student is working on Challenge 2: Spacecraft Software Features. The task requires the student to act as an engineer, reason and list the necessary features for a spacecraft control system (e.g., engine management, oxygen monitoring, Earth communication...). Encourage them to imagine real-world scenarios in space.";
    } else {
      challengeContext = "The student is on the TagEdu Homepage. Briefly and engagingly introduce the platform and encourage them to click on the coding challenges to get started.";
    }

    systemInstruction = `
      You are the pedagogical AI Assistant of the TagEdu learning platform.
      [CURRENT STUDENT CONTEXT]: ${challengeContext}
      [CORE PRINCIPLES]:
      1. You must NEVER give direct answers or write code for the student under any circumstances.
      2. You may only suggest thinking approaches, explain logic, give similar examples, and ask open-ended questions so the student thinks for themselves.
      3. Always be friendly and motivating. Use "I" for yourself and "you" for the student.
      4. Keep responses concise and well-structured. Use Markdown (bold, bullet points) for readability.
      5. Always respond in English.
    `;
  } else {
    // Vietnamese system prompt (original)
    if (challengeId === "challenge7") {
      challengeContext = "Học viên đang làm Thử thách 1: Phân loại phần mềm. Đề bài yêu cầu học viên phân biệt và xếp các phần mềm (như Windows, Word, Excel, Chrome, WinRAR...) vào 3 nhóm: Phần mềm Hệ thống, Phần mềm Ứng dụng, và Phần mềm Tiện ích. Nếu học viên hỏi về một phần mềm cụ thể, hãy hướng dẫn họ phân tích mục đích sử dụng của nó để tự tìm ra nhóm phù hợp.";
    } else if (challengeId === "challenge8") {
      challengeContext = "Học viên đang làm Thử thách 2: Chức năng phần mềm Tàu vũ trụ. Đề bài yêu cầu học viên đóng vai kỹ sư, suy luận và liệt kê các tính năng cần thiết cho hệ thống điều khiển một con tàu vũ trụ (ví dụ: quản lý động cơ, theo dõi oxy, liên lạc trái đất...). Hãy khuyến khích họ tưởng tượng ra các tình huống thực tế trên không gian.";
    } else {
      challengeContext = "Học viên đang ở Trang chủ TagEdu. Hãy giới thiệu ngắn gọn, hấp dẫn về nền tảng và khuyến khích họ click vào các thử thách lập trình để bắt đầu.";
    }

    systemInstruction = `
      Bạn là Trợ lý AI sư phạm của nền tảng học tập TagEdu. 
      [BỐI CẢNH HIỆN TẠI CỦA HỌC VIÊN]: ${challengeContext}
      [NGUYÊN TẮC CỐT LÕI]: 
      1. Tuyệt đối KHÔNG ĐƯỢC đưa ra đáp án trực tiếp hoặc viết code hộ dưới mọi hình thức.
      2. Chỉ được phép gợi ý tư duy, giải thích logic, đưa ra ví dụ tương tự và đặt câu hỏi mở để học viên tự suy nghĩ.
      3. Luôn xưng "mình" và gọi người dùng là "bạn" một cách thân thiện, tạo động lực.
      4. Trình bày ngắn gọn, súc tích, sử dụng Markdown (in đậm, bullet points) cho dễ đọc.
      5. Luôn trả lời bằng tiếng Việt.
    `;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const [historyRows] = await db.promise().query(
      'SELECT sender_role, content FROM chat_messages WHERE user_id = ? AND challenge_id = ? AND session_id = ? ORDER BY created_at ASC',
      [userId, challengeId, sessionId]
    );

    const chatHistory = historyRows.map(row => ({
      role: row.sender_role === 'ai' ? 'model' : 'user',
      parts: [{ text: row.content }],
    }));

    await db.promise().query(
      'INSERT INTO chat_messages (user_id, challenge_id, session_id, sender_role, content) VALUES (?, ?, ?, ?, ?)',
      [userId, challengeId, sessionId, 'user', message]
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction });
    const chat = model.startChat({ history: chatHistory });
    const resultStream = await streamGeminiWithRetry(chat, message, 2);
    let fullAiResponse = "";

    for await (const chunk of resultStream.stream) {
      const chunkText = chunk.text();
      fullAiResponse += chunkText; 
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end(); 

    await db.promise().query(
      'INSERT INTO chat_messages (user_id, challenge_id, session_id, sender_role, content) VALUES (?, ?, ?, ?, ?)',
      [userId, challengeId, sessionId, 'ai', fullAiResponse]
    );
  } catch (error) {
    console.error("❌ Lỗi xử lý chat stream:", error);
    res.write(`data: ${JSON.stringify({ error: 'Đã có lỗi xảy ra.' })}\n\n`);
    res.end();
  }
};