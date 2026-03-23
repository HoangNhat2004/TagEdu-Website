import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, X, Send, Bot, User as UserIcon,
  Loader2, Trash2, ThumbsUp, ThumbsDown, ChevronDown
} from "lucide-react";
import { Button } from "./ui/button";
import { View } from "@/pages/Index";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useChatbot } from "@/hooks/useChatbot";

interface ChatbotProps {
  currentView: View;
}

export function ChatbotWidget({ currentView }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
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
    getQuickReplies,
  } = useChatbot(currentView, isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isThinking]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const confirmClearChat = () => {
    handleClearChat();
    setIsClearModalOpen(false);
  };

  const quickReplies = getQuickReplies(currentView);

  return (
    <>
      {/* Overlay mờ khi panel mở trên mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex flex-col
          transition-all duration-300 ease-in-out
          ${isOpen
            ? "w-full sm:w-[420px] h-[85vh] sm:h-[calc(100vh-64px)] opacity-100 translate-y-0 sm:translate-y-0"
            : "w-0 h-0 opacity-0 pointer-events-none"
          }
          rounded-t-2xl sm:rounded-tl-2xl sm:rounded-tr-none
          border border-gray-200 bg-white shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] leading-tight">TagEdu AI</h3>
              <span className="text-xs opacity-75">
                {isLoggedIn ? "Trợ lý hỗ trợ học tập" : "Chưa đăng nhập"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isLoggedIn && (
              <button
                title="Xóa lịch sử chat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/70 hover:bg-red-500 hover:text-white transition-colors"
                onClick={() => setIsClearModalOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/70 hover:bg-white/20 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/60">
          <div className="flex flex-col gap-5">
            {messages.map((msg) => {
              if (msg.role === "ai" && msg.content === "" && isThinking) return null;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm
                      ${msg.role === "ai"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {msg.role === "ai" ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  </div>

                  {/* Bubble + feedback */}
                  <div className={`flex flex-col max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm
                        ${msg.role === "ai"
                          ? "rounded-tl-sm bg-white border border-gray-100 text-gray-800"
                          : "rounded-tr-sm bg-primary text-primary-foreground whitespace-pre-wrap"
                        }`}
                    >
                      {msg.role === "ai" ? (
                        <div className="prose prose-sm prose-p:leading-relaxed prose-pre:p-0 max-w-none text-left">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                              code: ({ node, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || "");
                                const isInline = !match && !String(children).includes("\n");
                                const { ref, ...rest } = props as any;
                                return isInline ? (
                                  <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded-md text-[13px] font-mono" {...rest}>
                                    {children}
                                  </code>
                                ) : (
                                  <div className="my-3 rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e] shadow-inner text-left">
                                    {match && (
                                      <div className="bg-[#2d2d2d] px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700">
                                        {match[1]}
                                      </div>
                                    )}
                                    <SyntaxHighlighter
                                      style={vscDarkPlus as any}
                                      language={match ? match[1] : "text"}
                                      PreTag="div"
                                      customStyle={{ margin: 0, padding: "12px", fontSize: "13px", background: "transparent" }}
                                      {...rest}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  </div>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Feedback */}
                    {msg.role === "ai" && !isLoading && msg.id !== "guest-welcome" && msg.id !== "error-auth" && (
                      <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-50 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleFeedback(msg.id, "up")}
                          className={`p-1 rounded transition-colors ${msg.feedback === "up" ? "text-green-600 bg-green-100" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "down")}
                          className={`p-1 rounded transition-colors ${msg.feedback === "down" ? "text-red-600 bg-red-100" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator — dấu chấm nhảy */}
            {isThinking && (
              <div className="flex gap-3 flex-row">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm px-4 py-3 gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick replies — wrap tự động, không scroll ngang */}
        {!isLoading && isLoggedIn && quickReplies.length > 0 && (
          <div className="border-t border-gray-100 bg-white px-3 pt-3 pb-0 shrink-0">
            <p className="text-[11px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Gợi ý nhanh</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(reply)}
                  disabled={isLoading}
                  className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary
                    hover:bg-primary/15 transition-colors disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-gray-100 bg-white px-3 pt-2 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={isLoggedIn ? "Hỏi gợi ý tại đây... (Enter để gửi)" : "Vui lòng đăng nhập để chat..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !isLoggedIn}
              className="flex-1 resize-none bg-transparent text-[14px] text-gray-800 placeholder:text-gray-400
                focus:outline-none disabled:opacity-50 max-h-[120px] min-h-[22px]"
              style={{ lineHeight: "1.5", paddingTop: "2px", paddingBottom: "2px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading || !isLoggedIn}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white
                hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">
            TagEdu AI chỉ định hướng tư duy, tuyệt đối không giải hộ.
          </p>
        </div>
      </div>

      {/* Nút mở chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl
          transition-all duration-200 hover:scale-110 active:scale-95
          ${isOpen
            ? "bg-gray-700 text-white hover:bg-gray-800"
            : "bg-primary text-white"
          }
          ${isOpen ? "sm:hidden" : ""}
        `}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>

      {/* Modal xác nhận xóa chat */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 mx-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Xóa cuộc trò chuyện?</h3>
            <p className="mb-6 text-sm text-gray-500">
              Toàn bộ lịch sử tin nhắn sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsClearModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                onClick={confirmClearChat}
              >
                Xóa ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}