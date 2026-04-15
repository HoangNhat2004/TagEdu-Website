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
import { useI18n } from "@/lib/i18n";

interface ChatbotProps {
  currentView: View;
}

export function ChatbotWidget({ currentView }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useI18n();

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
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isThinking, isOpen]);

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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
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
          border border-white/10 glass-card shadow-[0_0_40px_rgba(0,212,255,0.15)] overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-black/40 border-b border-white/5 backdrop-blur-md px-4 py-3 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] leading-tight text-gradient-cyan">TagEdu AI</h3>
              <span className="text-xs text-gray-400 tracking-wide">
                {isLoggedIn ? t("chat.subtitle") : t("chat.notLoggedIn")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isLoggedIn && (
              <button
                title={t("chat.clearTitle")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                onClick={() => setIsClearModalOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-[#0a0e1a]/80 backdrop-blur-sm">
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
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm border
                      ${msg.role === "ai"
                        ? "bg-[#131b2f] text-cyan-400 border-cyan-500/30"
                        : "bg-cyan-900/30 text-cyan-400 border-cyan-500/20"
                      }`}
                  >
                    {msg.role === "ai" ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  </div>

                  {/* Bubble + feedback */}
                  <div className={`flex flex-col max-w-[82%] w-fit min-w-0 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm min-w-0 w-full break-words [overflow-wrap:anywhere] whitespace-normal overflow-x-hidden
                        ${msg.role === "ai"
                          ? "rounded-tl-sm bg-[#131b2f] border border-white/5 text-gray-200 shadow-md"
                          : "rounded-tr-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 whitespace-pre-wrap"
                        }`}
                    >
                      {msg.role === "ai" ? (
                        <div className="prose prose-sm prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-full w-full min-w-0 [overflow-wrap:anywhere] break-words whitespace-normal text-left prose-strong:text-white pr-3 overflow-x-hidden">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                              strong: ({ node, ...props }) => {
                                // If this is the guest welcome message, make bold text clickable to open login
                                if (!isLoggedIn && msg.id === "guest-welcome") {
                                  return (
                                    <strong
                                      className="font-bold text-cyan-400 cursor-pointer hover:text-cyan-300 underline underline-offset-2 decoration-cyan-400/50 transition-colors"
                                      onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
                                      {...props}
                                    />
                                  );
                                }
                                return <strong className="font-bold text-white tracking-wide" {...props} />;
                              },
                              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-cyan-200" {...props} />,
                              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                              code: ({ node, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || "");
                                const isInline = !match && !String(children).includes("\n");
                                const { ref, ...rest } = props as any;
                                return isInline ? (
                                  <code className="bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-white/5" {...rest}>
                                    {children}
                                  </code>
                                ) : (
                                  <div className="my-3 rounded-lg overflow-hidden border border-white/10 bg-[#0d1117] shadow-inner text-left">
                                    {match && (
                                      <div className="bg-[#161b22] px-3 py-1.5 text-xs text-gray-400 border-b border-white/5">
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
                    {msg.role === "ai" && !isLoading && msg.id !== "guest-welcome" && msg.id !== "error-auth" && !msg.id.startsWith("welcome-") && (
                      <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-50 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleFeedback(msg.id, "up")}
                          className={`p-1 rounded transition-colors ${msg.feedback === "up" ? "text-green-400 bg-green-500/20" : "text-gray-500 hover:text-green-400 hover:bg-green-500/10"}`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "down")}
                          className={`p-1 rounded transition-colors ${msg.feedback === "down" ? "text-red-400 bg-red-500/20" : "text-gray-500 hover:text-red-400 hover:bg-red-500/10"}`}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex gap-3 flex-row">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#131b2f] border border-cyan-500/30 text-cyan-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center rounded-2xl rounded-tl-sm bg-[#131b2f] border border-white/5 shadow-md px-4 py-3 gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-cyan-500/70 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick replies */}
        {!isLoading && isLoggedIn && quickReplies.length > 0 && (
          <div className="border-t border-white/5 bg-[#0d1117]/95 backdrop-blur-md px-3 pt-3 pb-0 shrink-0">
            <p className="text-[11px] text-gray-500 font-bold mb-2 uppercase tracking-widest">{t("chat.quickLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(reply)}
                  disabled={isLoading}
                  className="rounded-full border border-cyan-500/30 bg-cyan-900/20 px-3 py-1.5 text-xs font-medium text-cyan-300
                    hover:bg-cyan-800/40 hover:text-cyan-200 hover:border-cyan-400 transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(0,212,255,0.05)]"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-white/5 bg-[#0d1117] backdrop-blur-md px-3 pt-2 pb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#161b22] px-3 py-1.5 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={isLoggedIn ? t("chat.placeholder") : t("chat.placeholderGuest")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !isLoggedIn}
              className="flex-1 resize-none bg-transparent text-[14px] text-gray-200 placeholder:text-gray-600
                focus:outline-none disabled:opacity-50 max-h-[120px] min-h-[22px]"
              style={{ lineHeight: "1.5", paddingTop: "2px", paddingBottom: "2px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading || !isLoggedIn}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-black font-bold
                hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(0,212,255,0.3)] disabled:shadow-none"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-600">
            {t("chat.disclaimer")}
          </p>
        </div>
      </div>

      {/* Nút mở chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_0_20px_rgba(0,212,255,0.4)]
          transition-all duration-200 hover:scale-110 active:scale-95
          ${isOpen
            ? "bg-[#161b22] text-gray-400 border border-white/10 hover:text-white"
            : "bg-cyan-500 text-black border border-cyan-300"
          }
          ${isOpen ? "sm:hidden" : ""}
        `}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>

      {/* Modal xác nhận xóa chat */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl glass-card p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 mx-4 border border-white/10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{t("chat.clearModalTitle")}</h3>
            <p className="mb-6 text-sm text-gray-400">
              {t("chat.clearModalMsg")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white"
                onClick={() => setIsClearModalOpen(false)}
              >
                {t("chat.clearCancel")}
              </Button>
              <Button
                className="flex-1 bg-red-600/90 text-white hover:bg-red-500 border-0 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                onClick={confirmClearChat}
              >
                {t("chat.clearConfirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}