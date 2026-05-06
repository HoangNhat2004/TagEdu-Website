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
// [CẬP NHẬT 30/04/2026] Danh sách model theo thứ tự ưu tiên (đã xác nhận khả dụng từ ListModels API)
// - gemini-2.5-flash: model chính, có free tier (20 RPD, 5 RPM) nhưng hay bị 503 do quá tải
// - gemini-2.5-flash-lite: phiên bản nhẹ hơn, ít bị quá tải hơn
// - gemini-2.0-flash-lite: dự phòng cuối cùng
// ĐÃ LOẠI BỎ: gemini-2.0-flash (quota free = 0), gemini-1.5-flash (404 not found)
const MODEL_PRIORITY = [
  "gemini-2.5-flash", 
  "gemini-1.5-flash-latest", 
  "gemini-1.5-flash",
  "gemini-pro",
  "gemini-1.0-pro",
  "gemini-2.5-flash-lite", 
  "gemini-1.5-flash-8b-latest", 
  "gemini-2.0-flash-lite"
];

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

/**
 * [CẬP NHẬT 30/04/2026] Chiến lược retry tối ưu cho lỗi 503 (quá tải):
 * 
 * Với MỖI model trong danh sách ưu tiên:
 *   → Thử 2 VÒNG (rounds) qua tất cả keys
 *   → Vòng 1: delay ngắn (3-8s) — thử nhanh xem key nào may mắn
 *   → Vòng 2: delay dài (8-15s) — chờ server phục hồi
 * 
 * Tổng cộng: 3 models × 2 rounds × 6 keys = tối đa 36 lần thử
 * Thời gian tối đa: ~90 giây (đủ để server Google phục hồi từ 503)
 * 
 * Lỗi 429 (hết quota): xoay key ngay, không cần delay
 * Lỗi 404 (model không tồn tại): bỏ qua model, thử model tiếp theo
 */
const streamGeminiWithRotationAndRetry = async (chatHistory, systemInstruction, message) => {
  const keys = getApiKeys();
  let lastError = null;
  const MAX_ROUNDS = 2; // Số vòng thử cho mỗi model

  for (let modelIndex = 0; modelIndex < MODEL_PRIORITY.length; modelIndex++) {
    const currentModelName = MODEL_PRIORITY[modelIndex];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      if (round > 0) {
        console.log(`[Round ${round + 1}] 🔁 Thử lại vòng ${round + 1} cho model ${currentModelName}...`);
      }

      // Thử tất cả keys cho model hiện tại trong vòng này
      for (let keyAttempt = 0; keyAttempt < keys.length; keyAttempt++) {
        try {
          const { chat } = getGeminiModel(chatHistory, systemInstruction, currentModelName);
          const result = await chat.sendMessageStream(message);
          console.log(`[AI OK] ✅ Model: ${currentModelName} | Key: ${currentKeyIndex + 1}/${keys.length} | Round: ${round + 1}`);
          return { result, modelUsed: currentModelName };
        } catch (error) {
          lastError = error;
          const status = Number(error?.status);

          console.log(`[Cảnh báo AI] Model: ${currentModelName} | Key: ${currentKeyIndex + 1}/${keys.length} | Lỗi: ${status} | Round: ${round + 1}`);

          // Lỗi 404: model không tồn tại → bỏ qua model này hoàn toàn
          if (status === 404) {
            console.log(`[Model Skip] ⏭️ Model ${currentModelName} không tồn tại, thử model tiếp theo...`);
            round = MAX_ROUNDS; // Thoát luôn cả vòng round
            break; // Thoát vòng key
          }

          // Lỗi retryable (429, 500, 502, 503, 504) → xoay key
          if (shouldRetryGeminiError(error)) {
            currentKeyIndex = (currentKeyIndex + 1) % keys.length;
            console.log(`[Key Rotation] 🔄 Chuyển sang Key số ${currentKeyIndex + 1}`);

            // Lỗi server (503/500/502/504): chờ delay tùy theo vòng
            if (status === 503 || status === 500 || status === 502 || status === 504) {
              // Vòng 1: delay 3-8s | Vòng 2: delay 8-15s
              const baseDelay = round === 0 ? 3000 : 8000;
              const maxDelay = round === 0 ? 8000 : 15000;
              const delayMs = Math.min(baseDelay + (1000 * keyAttempt), maxDelay);
              console.log(`[Retry] ⏳ Chờ ${Math.round(delayMs / 1000)}s trước khi thử lại...`);
              await sleep(delayMs);
            }
            continue;
          }

          // Lỗi không thể retry (400, 403, v.v.) → dừng luôn
          throw error;
        }
      }
    }

    // Đã thử hết tất cả rounds + keys cho model hiện tại
    if (modelIndex < MODEL_PRIORITY.length - 1) {
      console.log(`[Model Fallback] 🔄 Đã thử hết ${MAX_ROUNDS} vòng × ${keys.length} keys cho ${currentModelName}, chuyển sang ${MODEL_PRIORITY[modelIndex + 1]}`);
    }
  }

  console.log(`❌ Đã thử hết tất cả ${MODEL_PRIORITY.length} models × ${MAX_ROUNDS} rounds × ${keys.length} keys, không thành công.`);
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

// [MỚI] Hàm xác định cấp độ gợi ý dựa trên số tin nhắn User đã gửi trong phiên
const determineHintLevel = (userMessageCount) => {
  if (userMessageCount <= 1) return 'conceptual';
  if (userMessageCount <= 3) return 'directional';
  return 'syntax';
};

// [MỚI] Hàm tạo chỉ dẫn phụ cho AI theo cấp độ gợi ý hiện tại (Toàn bộ bằng Tiếng Anh để AI xử lý logic tốt hơn)
const getHintInstruction = (hintLevel) => {
  const hints = {
    conceptual: "[HINT LEVEL: CONCEPTUAL] ONLY ask open-ended questions about the CONCEPT. Do NOT mention syntax, variable names, or code patterns. Help the student think about the 'why'.",
    directional: "[HINT LEVEL: DIRECTIONAL] Point the student to the RIGHT AREA or concept (e.g., 'think about assignment'). Mention general programming terms but NO actual code solutions.",
    syntax: "[HINT LEVEL: SYNTAX-FOCUSED] Explain syntax rules in general (e.g., 'In Python, we use the = operator'). Give a SIMILAR but DIFFERENT code example. NEVER write the exact solution code."
  };
  return hints[hintLevel] || "";
};

exports.handleChat = async (req, res) => {
  const userId = req.user.userId;
  const { challengeId = 'landing', sessionId = 'default_session', message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Tin nhắn quá dài (tối đa 2000 ký tự)' });
  }

  let challengeContext = "";
  
  if (challengeId === "challenge1") {
    challengeContext = "Mission: Software Classification (Windows, Chrome, Word...). Goal: Sort into System/App/Utility.";
  } else if (challengeId === "challenge2") {
    challengeContext = "Mission: Spacecraft Features. Goal: List engine management, oxygen monitoring, etc.";
  } else if (challengeId === "challenge3") {
    challengeContext = "Mission: Orbit 01 (Python). Goal: Define 'fuelLevel' and call 'calculateTrajectory()'.";
  } else {
    challengeContext = "TagEdu Homepage. General introduction to coding adventures.";
  }

  // [CỐT LÕI - SỬA LỖI NGÔN NGỮ] Sử dụng chỉ dẫn Tiếng Anh hoàn toàn để AI không bị bias tiếng Việt
  let systemInstruction = `
    [STRICT LANGUAGE RULE]: 
    1. DETECT THE LANGUAGE OF THE STUDENT'S LATEST MESSAGE.
    2. RESPOND EXCLUSIVELY IN THAT SAME LANGUAGE. 
    3. IF THE STUDENT ASKS IN ENGLISH, YOU MUST REPLY IN ENGLISH. 
    4. IF THE STUDENT ASKS IN VIETNAMESE, YOU MUST REPLY IN VIETNAMESE.
    5. IGNORE THE LANGUAGE OF THE PREVIOUS CONVERSATION HISTORY IF THE CURRENT MESSAGE SWITCHES LANGUAGES.

    [IDENTITY]: You are the pedagogical AI Assistant of TagEdu.
    [CONTEXT]: ${challengeContext}
    
    [PEDAGOGICAL RULES]:
    - NEVER give direct code answers or solve the task for the student.
    - Guide the student step-by-step using questions and hints.
    - Be friendly and encouraging.
    - Use Markdown for formatting.
    - In English, use "I" and "you". In Vietnamese, use "mình" and "bạn".

    [CONVERSATION CONTINUITY]:
    - You **MUST START YOUR VERY FIRST SENTENCE** with a direct greeting (e.g., "Hello!", "Chào bạn!") in your **VERY FIRST** reply of a conversation (when 'chatHistory' is empty). Do NOT skip the greeting, regardless of the language.
    - From the **SECOND** reply onwards, it is **STRICTLY FORBIDDEN** to greet again. No "Chào bạn!", no "Hello!", no "Hi!" at the start of any follow-up messages.
    - This rule applies even if the user switches languages mid-conversation.
    - Instead of greeting in follow-up messages, go straight to addressing the user's question or topic naturally.
  `;

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

    // [MỚI] Đếm số tin nhắn User trong phiên hiện tại để xác định cấp độ gợi ý
    const userMessageCount = historyRows.filter(r => r.sender_role === 'user').length;
    const currentHintLevel = challengeId === 'landing' ? 'none' : determineHintLevel(userMessageCount);

    // [MỚI] Nối thêm chỉ dẫn cấp độ gợi ý vào System Instruction
    if (currentHintLevel !== 'none') {
      const hintInstruction = getHintInstruction(currentHintLevel);
      systemInstruction += `\n${hintInstruction}`;
    }

    // [MỚI - ONBOARDING] Truy vấn tuổi học viên để cá nhân hóa giọng điệu AI
    const [userRows] = await db.promise().query('SELECT date_of_birth FROM users WHERE id = ?', [userId]);
    if (userRows.length > 0 && userRows[0].date_of_birth) {
      const dob = new Date(userRows[0].date_of_birth);
      const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
      
      let ageTone = "";
      if (age <= 8) {
        ageTone = "[AGE BAND: 5-8] The student is very young. Use VERY simple words, fun emojis (🚀🌟), toy/cartoon analogies. Keep sentences short.";
      } else if (age <= 12) {
        ageTone = "[AGE BAND: 9-12] The student is a child. Use everyday analogies (school, games). Explain step-by-step. Be warm and patient.";
      } else {
        ageTone = "[AGE BAND: 13+] The student is a teenager or older. Use more technical terms when appropriate. Be concise and professional, but still encouraging.";
      }
      systemInstruction += `\n${ageTone}`;
    }

    await db.promise().query(
      'INSERT INTO chat_messages (user_id, challenge_id, session_id, sender_role, content) VALUES (?, ?, ?, ?, ?)',
      [userId, challengeId, sessionId, 'user', message]
    );

    // [GIẢI PHÁP TỐI THƯỢNG] Bọc trực tiếp tin nhắn bằng Lệnh Bắt Buộc Ngôn Ngữ
    // Điều này buộc AI phải đọc lệnh này ngay sát trước khi sinh ra câu trả lời, 
    // đánh bại hoàn toàn thói quen dùng tiếng Việt từ lịch sử chat.
    const enforcedMessage = `[CRITICAL INSTRUCTION: Detect the language of the following text. You MUST respond in that EXACT same language. If it is English, reply in English. If it is Vietnamese, reply in Vietnamese. Ignore previous conversation languages.]\n\nText: "${message}"`;

    // [CẬP NHẬT 30/04/2026] Dùng NON-STREAMING (sendMessage) làm phương thức chính
    // Lý do: streaming (sendMessageStream) liên tục bị "Failed to parse stream" do server Google quá tải
    // Non-streaming ổn định hơn vì không cần duy trì kết nối liên tục
    let fullAiResponse = "";
    
    const keys = getApiKeys();
    let aiCallSuccess = false;
    const MAX_ROUNDS = 2;

    for (let modelIndex = 0; modelIndex < MODEL_PRIORITY.length && !aiCallSuccess; modelIndex++) {
      const currentModelName = MODEL_PRIORITY[modelIndex];

      for (let round = 0; round < MAX_ROUNDS && !aiCallSuccess; round++) {
        if (round > 0) {
          console.log(`[Round ${round + 1}] 🔁 Thử lại vòng ${round + 1} cho model ${currentModelName}...`);
        }

        for (let keyAttempt = 0; keyAttempt < keys.length && !aiCallSuccess; keyAttempt++) {
          try {
            console.log(`[AI Call] Model: ${currentModelName} | Key: ${currentKeyIndex + 1}/${keys.length} | Round: ${round + 1}`);
            const { chat } = getGeminiModel(chatHistory, systemInstruction, currentModelName);
            const result = await chat.sendMessage(enforcedMessage);
            fullAiResponse = result.response.text();
            aiCallSuccess = true;
            console.log(`[AI OK] ✅ Model: ${currentModelName} | Key: ${currentKeyIndex + 1}/${keys.length} | Round: ${round + 1}`);
          } catch (error) {
            const status = Number(error?.status);
            console.log(`[Cảnh báo AI] Model: ${currentModelName} | Key: ${currentKeyIndex + 1}/${keys.length} | Lỗi: ${status} | Round: ${round + 1}`);

            if (status === 404 || status === 400) {
              console.log(`[Model Skip] ⏭️ Model ${currentModelName} không khả dụng (Lỗi ${status}), thử model tiếp theo...`);
              round = MAX_ROUNDS; // Thoát luôn cả vòng round
              break;
            }

            if (shouldRetryGeminiError(error)) {
              currentKeyIndex = (currentKeyIndex + 1) % keys.length;
              console.log(`[Key Rotation] 🔄 Chuyển sang Key số ${currentKeyIndex + 1}`);

              if (status === 503 || status === 500 || status === 502 || status === 504) {
                const baseDelay = round === 0 ? 3000 : 8000;
                const maxDelay = round === 0 ? 8000 : 15000;
                const delayMs = Math.min(baseDelay + (1000 * keyAttempt), maxDelay);
                console.log(`[Retry] ⏳ Chờ ${Math.round(delayMs / 1000)}s trước khi thử lại...`);
                await sleep(delayMs);
              }
              continue;
            }

            // Lỗi không thể retry → dừng
            throw error;
          }
        }
      }

      if (!aiCallSuccess && modelIndex < MODEL_PRIORITY.length - 1) {
        console.log(`[Model Fallback] 🔄 Đã thử hết cho ${currentModelName}, chuyển sang ${MODEL_PRIORITY[modelIndex + 1]}`);
      }
    }

    if (!aiCallSuccess) {
      console.log(`❌ Đã thử hết tất cả models × keys, không thành công.`);
      throw new Error('Tất cả API keys và models đều thất bại.');
    }

    // Gửi response qua SSE (giả lập streaming bằng cách chia nhỏ response)
    const CHUNK_SIZE = 15; // Mỗi chunk ~15 ký tự để tạo hiệu ứng gõ chữ
    for (let i = 0; i < fullAiResponse.length; i += CHUNK_SIZE) {
      const chunk = fullAiResponse.slice(i, i + CHUNK_SIZE);
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // [SỬA] Lưu vào DB kèm theo hint_level TRƯỚC KHI gửi [DONE]
    await db.promise().query(
      'INSERT INTO chat_messages (user_id, challenge_id, session_id, sender_role, content, hint_level) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, challengeId, sessionId, 'ai', fullAiResponse, currentHintLevel]
    );

    // [MỚI] Gửi hint_level qua SSE để Frontend có thể hiển thị (nếu cần)
    res.write(`data: ${JSON.stringify({ hintLevel: currentHintLevel })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end(); 
  } catch (error) {
    console.error("❌ Lỗi xử lý chat cuối cùng:", error);
    res.write(`data: ${JSON.stringify({ error: 'Đã có lỗi xảy ra.' })}\n\n`);
    res.end();
  }
};
