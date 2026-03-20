import { useState, useEffect } from "react";
import { View } from "@/pages/Index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  feedback?: "up" | "down" | null;
};

export function useChatbot(currentView: View, isOpen: boolean) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  const [authTrigger, setAuthTrigger] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setAuthTrigger(prev => prev + 1);
    window.addEventListener("auth_change", handleAuthChange);
    return () => window.removeEventListener("auth_change", handleAuthChange);
  }, []);

  useEffect(() => {
    setIsLoading(false);
    setIsThinking(false);
    setInputValue("");
  }, [currentView]);

  const getActiveUser = () => {
    try {
      const userStr = localStorage.getItem("tagedu_user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem("tagedu_token");
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const isLoggedIn = !!getActiveUser();
  const activeUserId = getActiveUser()?.id || 1;

  const getWelcomeMessage = (view: View) => {
    const userName = getActiveUser()?.fullName || "bạn";
    if (view === "challenge7") {
      return `Chào ${userName}! Mình thấy bạn đang làm Thử thách 1: Phân loại phần mềm. Bạn cần gợi ý gì không?`;
    } else if (view === "challenge8") {
      return `Chào ${userName}! Mình thấy bạn đang ở Thử thách 2: Phần mềm Tàu vũ trụ. Hãy nói suy luận của bạn nhé!`;
    }
    return `Chào ${userName}! Mình là Trợ lý học tập TagEdu. Bạn cần hỗ trợ gì không?`;
  };

  const getQuickReplies = (view: View) => {
    if (view === "challenge7") {
      return ["Gợi ý cách phân loại", "Hệ thống và Tiện ích khác gì nhau?", "Cho mình xin một ví dụ"];
    } else if (view === "challenge8") {
      return ["Bắt đầu phân tích từ đâu?", "Phần mềm hệ thống ở đây là gì?", "Gợi ý kịch bản kiểm thử"];
    }
    return ["TagEdu là gì?", "Làm sao để bắt đầu học?", "AI hỗ trợ như thế nào?"];
  };

  useEffect(() => {
    const loadChatHistory = async () => {
      const token = localStorage.getItem("tagedu_token");
      if (!token) {
        setMessages([{
          id: "guest-welcome",
          role: "ai",
          content: "Chào bạn! Mình là Trợ lý học tập TagEdu. Vui lòng **Đăng nhập** ở góc trên cùng để bắt đầu trò chuyện và nhận gợi ý học tập nhé! 👋",
          feedback: null
        }]);
        return; 
      }

      try {
        const response = await fetch(`${API_URL}/chat-history?challengeId=${currentView}&sessionId=default_session`, {
          headers: { ...getAuthHeader() }
        });
        const data = await response.json();

        if (response.ok && data.length > 0) {
          setMessages(data.map((msg: any) => ({
            id: msg.id.toString(), role: msg.role, content: msg.content, feedback: null
          })));
        } else if (response.status === 401 || response.status === 403) {
          setMessages([{
            id: "error-auth", role: "ai", content: "⚠️ Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để xem lịch sử chat."
          }]);
        } else {
          setMessages([{
            id: "welcome-" + Date.now().toString(), role: "ai", content: getWelcomeMessage(currentView), feedback: null
          }]);
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử chat:", error);
      }
    };

    if (isOpen) loadChatHistory();
  }, [currentView, isOpen, authTrigger]); 

  const handleClearChat = async () => {
    try {
      const response = await fetch(`${API_URL}/chat-session`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ challengeId: currentView, sessionId: "default_session" }),
      });

      if (response.ok) {
        setMessages([{
          id: "welcome-" + Date.now().toString(), role: "ai", content: getWelcomeMessage(currentView), feedback: null
        }]);
      } else {
        alert("Có lỗi xảy ra hoặc bạn không có quyền xóa cuộc trò chuyện này.");
      }
    } catch (error) {
      alert("Không thể kết nối đến máy chủ để xóa chat.");
    }
  };

  const handleFeedback = (msgId: string, type: "up" | "down") => {
    setMessages((prev) => prev.map((msg) => msg.id === msgId ? { ...msg, feedback: msg.feedback === type ? null : type } : msg));
  };

  const handleSend = async (quickMessage?: string) => {
    const messageToSend = typeof quickMessage === "string" ? quickMessage : inputValue;
    if (!messageToSend.trim() || isLoading) return;
    
    const newUserMsg: Message = { id: "temp-" + Date.now().toString(), role: "user", content: messageToSend };
    const aiMsgId = "ai-" + Date.now().toString();
    const emptyAiMsg: Message = { id: aiMsgId, role: "ai", content: "", feedback: null };

    setMessages((prev) => [...prev, newUserMsg, emptyAiMsg]);
    if (typeof quickMessage !== "string") setInputValue("");
    
    setIsLoading(true);
    setIsThinking(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ challengeId: currentView, sessionId: "default_session", message: messageToSend }),
      });

      if (!response.ok) {
        throw new Error("API_ERROR");
      }
      if (!response.body) throw new Error("Không nhận được dữ liệu");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let aiText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          setIsThinking(false); 
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  aiText += parsed.text;
                  setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, content: aiText } : msg));
                }
              } catch (e) {}
            }
          }
        }
      }

      // [MỚI] Bắt lỗi "Sập ngầm": Stream chạy xong nhưng không có chữ nào được trả về
      if (aiText.trim() === "") {
        throw new Error("SILENT_CRASH");
      }

    } catch (error: any) {
      setIsThinking(false); // Đảm bảo tắt bong bóng suy nghĩ
      
      const errorMsg = "⚠️ Hiện tại có quá nhiều học viên đang đặt câu hỏi nên hệ thống hơi quá tải. Bạn vui lòng đợi một chút rồi thử lại nhé! 🥺";
      
      // Thay thế bong bóng trống bằng câu xin lỗi
      setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, content: errorMsg } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    isThinking,
    isLoggedIn,
    activeUserId,
    handleSend,
    handleClearChat,
    handleFeedback,
    getQuickReplies
  };
}