const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');
const getApiKeys = () => {
  const keysRaw = process.env.GEMINI_API_KEY || "";
  const keys = keysRaw.split(",").map(k => k.trim()).filter(k => k !== "");
  if (keys.length === 0) throw new Error("Chưa cấu hình GEMINI_API_KEY trong .env");
  return keys;
};

// Lưu vết con trỏ Key hiện tại để xoay vòng
let currentKeyIndex = 0;
const MODEL_PRIORITY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryGeminiError = (error) => {
  const status = Number(error?.status);
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

const getGeminiModel = (chatHistory, systemInstruction, modelName) => {
  const keys = getApiKeys();
  const selectedKey = keys[currentKeyIndex];
  const genAI = new GoogleGenerativeAI(selectedKey);
  const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
  const chat = model.startChat({ history: chatHistory });
  return { chat, model };
};

const streamGeminiWithRotationAndRetry = async (chatHistory, systemInstruction, message, maxRetries = 3) => {
  let attempt = 0;
  let modelIndex = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    const currentModelName = MODEL_PRIORITY[modelIndex];
    try {
      const { chat } = getGeminiModel(chatHistory, systemInstruction, currentModelName);
      const result = await chat.sendMessageStream(message);
      return { result, modelUsed: currentModelName };
    } catch (error) {
      lastError = error;
      const status = Number(error?.status);
      const keys = getApiKeys();
      
      console.log(`[Cảnh báo AI] Model: ${currentModelName} | Key: ${currentKeyIndex + 1} | Lỗi: ${status}`);

      // Nếu lỗi do Model không tồn tại (404) hoặc quá tải (503/500), hãy chuyển sang model dự phòng
      if ((status === 404 || status === 503 || status === 500) && modelIndex < MODEL_PRIORITY.length - 1) {
        modelIndex++;
        console.log(`[Model Fallback] 🔄 Chuyển sang model: ${MODEL_PRIORITY[modelIndex]}`);
        continue; 
      }

      // Nếu lỗi do giới hạn Key (429), hãy chuyển sang Key khác
      if ((status === 429) && keys.length > 1) {
          currentKeyIndex = (currentKeyIndex + 1) % keys.length;
          modelIndex = 0; // Thử lại từ model tốt nhất với Key mới
          console.log(`[Key Rotation] 🔄 Chuyển sang Key số ${currentKeyIndex + 1}`);
          attempt += 1;
          continue; 
      }
      
      if (!shouldRetryGeminiError(error) || attempt === maxRetries) throw error;

      const delayMs = 1000 * Math.pow(2, attempt);
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
    } else if (challengeId === "challenge9") {
      challengeContext = "The student is working on Mission Orbit 01 (Python). The task is to define a 'fuelLevel' variable (value 0-100) and invoke 'calculateTrajectory()'. Guide them on Python syntax if asked, but NEVER give direct code answers.";
    } else {
      challengeContext = "The student is on the TagEdu Homepage. Briefly and engagingly introduce the platform as a diverse learning environment to master Computer Science foundations (like Software logic, IT concepts) and Programming concepts (like Python) through progressive interactive challenges (from drag-and-drop to actual coding). Encourage them to dive into the Mission Map.";
    }

    systemInstruction = `
      You are the pedagogical AI Assistant of the TagEdu learning platform.
      [CURRENT STUDENT CONTEXT]: ${challengeContext}
      [CORE PRINCIPLES]:
      1. You must NEVER give direct answers or write code for the student under any circumstances.
      2. You may only suggest thinking approaches, explain logic, give similar examples, and ask open-ended questions so the student thinks for themselves.
      3. Always be friendly and motivating. Use "I" for yourself and "you" for the student. DO NOT repeat greetings (e.g., "Hello") if the conversation is already ongoing.
      4. Keep responses concise and well-structured. Use Markdown (bold, bullet points) for readability.
      5. Always respond in the same language the student used in their message. If they ask in Vietnamese, respond in Vietnamese. If they ask in English, respond in English.
    `;
  } else {
    // Vietnamese system prompt (original)
    if (challengeId === "challenge7") {
      challengeContext = "Học viên đang làm Thử thách 1: Phân loại phần mềm. Đề bài yêu cầu học viên phân biệt và xếp các phần mềm (như Windows, Word, Excel, Chrome, WinRAR...) vào 3 nhóm: Phần mềm Hệ thống, Phần mềm Ứng dụng, và Phần mềm Tiện ích. Nếu học viên hỏi về một phần mềm cụ thể, hãy hướng dẫn họ phân tích mục đích sử dụng của nó để tự tìm ra nhóm phù hợp.";
    } else if (challengeId === "challenge8") {
      challengeContext = "Học viên đang làm Thử thách 2: Chức năng phần mềm Tàu vũ trụ. Đề bài yêu cầu học viên đóng vai kỹ sư, suy luận và liệt kê các tính năng cần thiết cho hệ thống điều khiển một con tàu vũ trụ (ví dụ: quản lý động cơ, theo dõi oxy, liên lạc trái đất...). Hãy khuyến khích họ tưởng tượng ra các tình huống thực tế trên không gian.";
    } else if (challengeId === "challenge9") {
      challengeContext = "Học viên đang làm Thử thách Nhiệm vụ Quỹ đạo 01 (Python). Họ cần khai báo biến 'fuelLevel' (0-100) và gọi hàm 'calculateTrajectory()'. Hãy hướng dẫn cú pháp Python nếu cần, tuyệt đối không viết code sẵn.";
    } else {
      challengeContext = "Học viên đang ở Trang chủ TagEdu. Hãy giới thiệu ngắn gọn, hấp dẫn về nền tảng như một môi trường để học hỏi các nền tảng Khoa học Máy tính (Khái niệm IT, Logic phần mềm) và Lập trình (Python) thông qua các thử thách tương tác đa dạng (từ kéo thả, trắc nghiệm cho đến viết code). Khuyến khích họ bắt đầu khám phá Bản đồ Thử thách (Mission Map).";
    }

    systemInstruction = `
      Bạn là Trợ lý AI sư phạm của nền tảng học tập TagEdu. 
      [BỐI CẢNH HIỆN TẠI CỦA HỌC VIÊN]: ${challengeContext}
      [NGUYÊN TẮC CỐT LÕI]: 
      1. Tuyệt đối KHÔNG ĐƯỢC đưa ra đáp án trực tiếp hoặc viết code hộ dưới mọi hình thức.
      2. Chỉ được phép gợi ý tư duy, giải thích logic, đưa ra ví dụ tương tự và đặt câu hỏi mở để học viên tự suy nghĩ.
      3. Luôn xưng "mình" và gọi người dùng là "bạn" một cách thân thiện, tạo động lực. KHÔNG lặp lại các câu chào hỏi (ví dụ: "Chào bạn") nếu cuộc trò chuyện đã bắt đầu. Hãy đi thẳng vào vấn đề.
      4. Trình bày ngắn gọn, súc tích, sử dụng Markdown (in đậm, bullet points) cho dễ đọc.
      5. Luôn trả lời bằng chính ngôn ngữ mà học viên sử dụng. Nếu học viên hỏi bằng tiếng Việt thì trả lời bằng tiếng Việt. Nếu hỏi bằng tiếng Anh thì trả lời bằng tiếng Anh.
    `;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // [BỔ SUNG] Chống đệm trên Render để stream không bị ngắt quãng
  res.setHeader('X-Accel-Buffering', 'no');

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

    let resultStream;
    let successfulModel = MODEL_PRIORITY[0];
    try {
      const completion = await streamGeminiWithRotationAndRetry(chatHistory, systemInstruction, message, 3);
      resultStream = completion.result;
      successfulModel = completion.modelUsed;
    } catch (error) {
      console.error("❌ Lỗi khi khởi tạo stream:", error);
      throw error;
    }

    let fullAiResponse = "";
    try {
      for await (const chunk of resultStream.stream) {
        try {
          const chunkText = chunk.text();
          fullAiResponse += chunkText; 
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        } catch (streamErr) {
          console.error("⚠️ Lỗi trích xuất text từ chunk stream:", streamErr);
        }
      }
    } catch (iterError) {
      // [FALLBACK] Nếu đang stream mà bị lỗi "Failed to parse stream", tự động chuyển sang chat thường với model đã thành công
      if (iterError.message.includes("Failed to parse stream") || iterError.message.includes("stream")) {
        console.log(`🔄 Hồi phục Stream lỗi, đang dùng: ${successfulModel}`);
        const { chat } = getGeminiModel(chatHistory, systemInstruction, successfulModel);
        const result = await chat.sendMessage(message);
        const fallbackText = result.response.text();
        fullAiResponse = fallbackText;
        res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
      } else {
        throw iterError;
      }
    }

    // Luôn lưu vào DB hoàn tất TRƯỚC KHI gửi [DONE]
    await db.promise().query(
      'INSERT INTO chat_messages (user_id, challenge_id, session_id, sender_role, content) VALUES (?, ?, ?, ?, ?)',
      [userId, challengeId, sessionId, 'ai', fullAiResponse]
    );

    res.write('data: [DONE]\n\n');
    res.end(); 
  } catch (error) {
    console.error("❌ Lỗi xử lý chat cuối cùng:", error);
    res.write(`data: ${JSON.stringify({ error: 'Đã có lỗi xảy ra.' })}\n\n`);
    res.end();
  }
};