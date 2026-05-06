import { useState, useEffect, useRef } from "react";
import { View } from "@/pages/Index";
import { useI18n } from "@/lib/i18n";

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
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const { t, language } = useI18n();
  const historyLoadSeqRef = useRef(0);
  const lastFetchIdRef = useRef("");
  const isSubmittingRef = useRef(false);
  
  const [authTrigger, setAuthTrigger] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setAuthTrigger(prev => prev + 1);
    window.addEventListener("auth_change", handleAuthChange);
    return () => window.removeEventListener("auth_change", handleAuthChange);
  }, []);

  useEffect(() => {
    const isGeneralView = ["landing", "progress", "settings"].includes(currentView);
    const viewMapping: Record<string, string> = {
      "challenge1": "challenge1",
      "challenge2": "challenge2",
      "challenge3": "challenge3"
    };
    const newFetchId = isGeneralView ? "landing" : (viewMapping[currentView] || currentView);

    if (newFetchId !== lastFetchIdRef.current) {
      setMessages([]); // Xoá trắng bóng chat phòng cũ để tránh hiện tượng lưu ảnh (flash) sang phòng mới
      lastFetchIdRef.current = newFetchId;
    }

    setIsLoading(false);
    setIsThinking(false);
    setInputValue("");
  }, [currentView]);

  // Instant translation for system messages when language changes
  useEffect(() => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === "guest-welcome") {
        return { ...msg, content: t("chat.guestWelcome") };
      }
      if (msg.id === "error-auth") {
        return { ...msg, content: t("chat.sessionExpired") };
      }
      if (msg.id.startsWith("welcome-")) {
        return { ...msg, content: getWelcomeMessage(currentView) };
      }
      return msg;
    }));
  }, [language, currentView]); // dependencies are language and view

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
    const user = getActiveUser();
    const userName = user?.fullName || "bạn";

    if (user?.role === 'guardian') {
      return t("chat.welcomeGuardian").replace("{name}", userName);
    }

    if (view === "challenge1") {
      return t("chat.welcomeChallenge1").replace("{name}", userName);
    } else if (view === "challenge2") {
      return t("chat.welcomeChallenge2").replace("{name}", userName);
    } else if (view === "challenge3") {
      return t("chat.welcomeChallenge3").replace("{name}", userName);
    }
    return t("chat.welcomeDefault").replace("{name}", userName);
  };

  const getQuickReplies = (view: View) => {
    const user = getActiveUser();
    if (user?.role === 'guardian') {
      return [t("chat.qr.guardian_1"), t("chat.qr.guardian_2")];
    }
    
    if (view === "challenge1") {
      return [t("chat.qr.c1_1"), t("chat.qr.c1_2"), t("chat.qr.c1_3")];
    } else if (view === "challenge2") {
      return [t("chat.qr.c2_1"), t("chat.qr.c2_2"), t("chat.qr.c2_3")];
    } else if (view === "challenge3") {
      return [t("chat.qr.c3_1"), t("chat.qr.c3_2"), t("chat.qr.c3_3")];
    }
    return [t("chat.qr.default1"), t("chat.qr.default2"), t("chat.qr.default3")];
  };

  useEffect(() => {
    const loadChatHistory = async () => {
      const loadSeq = ++historyLoadSeqRef.current;
      const token = localStorage.getItem("tagedu_token");
      if (!token) {
        if (loadSeq !== historyLoadSeqRef.current) return;
        setMessages([{
          id: "guest-welcome",
          role: "ai",
          content: t("chat.guestWelcome"),
          feedback: null
        }]);
        return; 
      }

      try {
      // Nhóm các màn hình ngoài sảnh (Home, Progress, Settings) về chung một phòng tên là 'landing' để kế thừa lịch sử cũ
      const isGeneralView = ["landing", "progress", "settings"].includes(currentView);
      const viewMapping: Record<string, string> = {
        "challenge1": "challenge1",
        "challenge2": "challenge2",
        "challenge3": "challenge3"
      };
      const fetchId = isGeneralView ? "landing" : (viewMapping[currentView] || currentView);

      setIsFetchingHistory(true);

      const response = await fetch(`${API_URL}/chat-history?challengeId=${fetchId}&sessionId=default_session`, {
          headers: { ...getAuthHeader() },
          cache: 'no-store'
        });
        const data = await response.json();

        if (response.ok) {
          if (loadSeq !== historyLoadSeqRef.current) return;
          if (data && data.length > 0) {
            setMessages(data.map((msg: any) => ({
              id: msg.id.toString(), role: msg.role, content: msg.content, feedback: msg.feedback ?? null
            })));
          } else {
            setMessages([{
              id: "welcome-" + Date.now().toString(), role: "ai", content: getWelcomeMessage(currentView), feedback: null
            }]);
          }
        } else {
          if (loadSeq !== historyLoadSeqRef.current) return;
          if (response.status === 401 || response.status === 403) {
            setMessages([{
              id: "error-auth", role: "ai", content: t("chat.sessionExpired")
            }]);
            localStorage.removeItem("tagedu_token");
            localStorage.removeItem("tagedu_user");
            window.dispatchEvent(new Event("auth_change"));
          } else {
            // Các lỗi khác thì hiện lời chào mặc định
            setMessages([{
              id: "welcome-" + Date.now().toString(), role: "ai", content: getWelcomeMessage(currentView), feedback: null
            }]);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử chat:", error);
      } finally {
        setIsFetchingHistory(false);
      }
    };

    if (isOpen) loadChatHistory();
  }, [currentView, isOpen, authTrigger, language]); 

  const handleClearChat = async () => {
    try {
      const isGeneralView = ["landing", "progress", "settings"].includes(currentView);
      const viewMapping: Record<string, string> = {
        "challenge1": "challenge1",
        "challenge2": "challenge2",
        "challenge3": "challenge3"
      };
      const deleteId = isGeneralView ? "landing" : (viewMapping[currentView] || currentView);

      const response = await fetch(`${API_URL}/chat-session`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ challengeId: deleteId, sessionId: "default_session" }),
      });

      if (response.ok) {
        setMessages([{
          id: "welcome-" + Date.now().toString(), role: "ai", content: getWelcomeMessage(currentView), feedback: null
        }]);
      } else {
        alert(t("chat.clearError"));
      }
    } catch (error) {
      alert(t("chat.clearNetworkError"));
    }
  };

  const handleFeedback = async (msgId: string, type: "up" | "down") => {
    const currentMsg = messages.find(m => m.id === msgId);
    const newFeedback = currentMsg?.feedback === type ? null : type;

    setMessages((prev) => prev.map((msg) => msg.id === msgId ? { ...msg, feedback: newFeedback } : msg));

    if (!isNaN(Number(msgId))) {
      try {
        await fetch(`${API_URL}/chat-feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          body: JSON.stringify({ messageId: msgId, feedback: newFeedback }),
        });
      } catch (e) {
        // Không cần báo lỗi cho user
      }
    }
  };

  const handleSend = async (quickMessage?: string) => {
    const messageToSend = typeof quickMessage === "string" ? quickMessage : inputValue;
    if (!messageToSend.trim() || isLoading) return;

    if (messageToSend.length > 2000) {
      alert(t("chat.errorTooLong") || "Message is too long (max 2000 characters)");
      return;
    }
    // Invalidate pending history loads to avoid stale data overriding new messages.
    historyLoadSeqRef.current += 1;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    const newUserMsg: Message = { id: "temp-" + Date.now().toString(), role: "user", content: messageToSend };
    const aiMsgId = "ai-" + Date.now().toString();
    const emptyAiMsg: Message = { id: aiMsgId, role: "ai", content: "", feedback: null };

    setMessages((prev) => [...prev, newUserMsg, emptyAiMsg]);
    if (typeof quickMessage !== "string") setInputValue("");
    
    setIsLoading(true);
    setIsThinking(true);

    try {
      const isGeneralView = ["landing", "progress", "settings"].includes(currentView);
      const viewMapping: Record<string, string> = {
        "challenge1": "challenge1",
        "challenge2": "challenge2",
        "challenge3": "challenge3"
      };
      const saveId = isGeneralView ? "landing" : (viewMapping[currentView] || currentView);

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ challengeId: saveId, sessionId: "default_session", message: messageToSend, language }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("tagedu_token");
          localStorage.removeItem("tagedu_user");
          window.dispatchEvent(new Event("auth_change"));
          throw new Error(t("chat.sessionExpired"));
        }
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
                  const textChunk = parsed.text;
                  // Hiệu ứng "Typewriter": Thêm dần từng cụm từ nhỏ thay vì ụp nguyên cục vào
                  const charsPerTick = 4; 
                  for (let i = 0; i < textChunk.length; i += charsPerTick) {
                    aiText += textChunk.slice(i, i + charsPerTick);
                    setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, content: aiText } : msg));
                    // Nghỉ 10ms cho mỗi cụm 4 ký tự -> tốc độ rất nhanh nhưng vẫn có dòng chảy
                    await new Promise(r => setTimeout(r, 10));
                  }
                }
              } catch (e) {}
            }
          }
        }
      }

      if (aiText.trim() === "") {
        throw new Error("SILENT_CRASH");
      }

      try {
        const histRes = await fetch(`${API_URL}/chat-history?challengeId=${saveId}&sessionId=default_session`, {
          headers: { ...getAuthHeader() },
          cache: 'no-store'
        });
        if (histRes.ok) {
          const histData = await histRes.json();
          if (histData.length > 0) {
            setMessages(histData.map((msg: any) => ({
              id: msg.id.toString(), role: msg.role, content: msg.content, feedback: msg.feedback ?? null
            })));
          }
        }
      } catch (e) { /* Không ảnh hưởng luồng chính */ }

    } catch (error: any) {
      setIsThinking(false);
      const errorMsg = t("chat.errorOverload");
      setMessages((prev) => prev.map((msg) => msg.id === aiMsgId ? { ...msg, content: errorMsg } : msg));
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    isThinking,
    isFetchingHistory,
    isLoggedIn,
    activeUserId,
    handleSend,
    handleClearChat,
    handleFeedback,
    getQuickReplies
  };
}
