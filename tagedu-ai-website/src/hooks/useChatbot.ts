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
  const { t, language } = useI18n();
  const historyLoadSeqRef = useRef(0);
  
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
      return t("chat.welcomeChallenge7").replace("{name}", userName);
    } else if (view === "challenge8") {
      return t("chat.welcomeChallenge8").replace("{name}", userName);
    }
    return t("chat.welcomeDefault").replace("{name}", userName);
  };

  const getQuickReplies = (view: View) => {
    if (view === "challenge7") {
      return [t("chat.qr.c7_1"), t("chat.qr.c7_2"), t("chat.qr.c7_3")];
    } else if (view === "challenge8") {
      return [t("chat.qr.c8_1"), t("chat.qr.c8_2"), t("chat.qr.c8_3")];
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
        const response = await fetch(`${API_URL}/chat-history?challengeId=${currentView}&sessionId=default_session`, {
          headers: { ...getAuthHeader() }
        });
        const data = await response.json();

        if (response.ok && data.length > 0) {
          if (loadSeq !== historyLoadSeqRef.current) return;
          setMessages(data.map((msg: any) => ({
            id: msg.id.toString(), role: msg.role, content: msg.content, feedback: msg.feedback ?? null
          })));
        } else if (response.status === 401 || response.status === 403) {
          if (loadSeq !== historyLoadSeqRef.current) return;
          setMessages([{
            id: "error-auth", role: "ai", content: t("chat.sessionExpired")
          }]);
        } else {
          if (loadSeq !== historyLoadSeqRef.current) return;
          setMessages([{
            id: "welcome-" + Date.now().toString(), role: "ai", content: getWelcomeMessage(currentView), feedback: null
          }]);
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử chat:", error);
      }
    };

    if (isOpen) loadChatHistory();
  }, [currentView, isOpen, authTrigger, language]); 

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
    // Invalidate pending history loads to avoid stale data overriding new messages.
    historyLoadSeqRef.current += 1;
    
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
        body: JSON.stringify({ challengeId: currentView, sessionId: "default_session", message: messageToSend, language }),
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

      if (aiText.trim() === "") {
        throw new Error("SILENT_CRASH");
      }

      try {
        const histRes = await fetch(`${API_URL}/chat-history?challengeId=${currentView}&sessionId=default_session`, {
          headers: { ...getAuthHeader() }
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