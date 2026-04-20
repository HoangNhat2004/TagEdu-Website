const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const keysRaw = process.env.GEMINI_API_KEY || "";
const keys = keysRaw.split(",").map(k => k.trim()).filter(k => k !== "");

async function listModels() {
  for (let i = 0; i < keys.length; i++) {
    console.log(`--- Checking Key ${i + 1} ---`);
    const genAI = new GoogleGenerativeAI(keys[i]);
    try {
      // Direct fetch using fetch to see raw response if possible, or use standard genAI
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keys[i]}`);
      const data = await response.json();
      if (data.models) {
        console.log("Available models:");
        data.models.forEach(m => console.log(` - ${m.name} (${m.displayName})`));
      } else {
        console.log("No models returned. Error:", data.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error listing models:", err);
    }
    console.log("\n");
  }
}

listModels();
