const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Lưu ý: SDK v0.24.x có thể không có hàm listModels trực tiếp như các bản cũ, 
    // nhưng chúng ta sẽ thử dùng fetch trực tiếp để chắc chắn nhất.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    console.log("=== DANH SÁCH MODEL KHẢ DỤNG ===");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- Model: ${m.name}`);
        console.log(`  Hỗ trợ: ${m.supportedGenerationMethods.join(", ")}`);
        console.log('---');
      });
    } else {
      console.log("Không tìm thấy model nào hoặc lỗi API Key.");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách model:", error);
  }
}

listModels();
