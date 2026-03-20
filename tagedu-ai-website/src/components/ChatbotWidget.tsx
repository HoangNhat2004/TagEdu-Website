import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2, Trash2, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
    getQuickReplies
  } = useChatbot(currentView, isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isThinking]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const confirmClearChat = () => {
    handleClearChat();
    setIsClearModalOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isOpen && (
          <div className="mb-4 flex h-[500px] w-[350px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-300">
            
            <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold leading-none">TagEdu AI</h3>
                  <span className="text-xs opacity-80">
                    {isLoggedIn ? `Trợ lý hỗ trợ (ID: ${activeUserId})` : "Chưa đăng nhập"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {isLoggedIn && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Xóa lịch sử & Tạo chat mới" 
                    className="h-8 w-8 text-primary-foreground hover:bg-red-500 hover:text-white transition-colors" 
                    onClick={() => setIsClearModalOpen(true)} 
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-muted/30 relative">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  if (msg.role === "ai" && msg.content === "" && isThinking) return null;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "ai" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {msg.role === "ai" ? <Bot className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                      </div>
                      
                      <div className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${msg.role === "ai" ? "rounded-tl-sm bg-white border border-gray-100 text-gray-800" : "rounded-tr-sm bg-primary text-primary-foreground whitespace-pre-wrap"}`}>
                          {msg.role === "ai" ? (
                            <div className="prose prose-sm prose-p:leading-relaxed prose-pre:p-0 max-w-none text-left">
                              <ReactMarkdown
                                components={{
                                  p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                  code: ({node, className, children, ...props}) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');
                                    const { ref, ...rest } = props as any;
                                    
                                    return isInline ? (
                                      <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded-md text-[13px] font-mono whitespace-pre-wrap" {...rest}>
                                        {children}
                                      </code>
                                    ) : (
                                      <div className="my-3 rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e] shadow-inner text-left">
                                        {match && (
                                          <div className="bg-[#2d2d2d] px-3 py-1.5 text-xs text-gray-400 font-sans border-b border-gray-700 flex justify-between items-center">
                                            <span>{match[1]}</span>
                                          </div>
                                        )}
                                        <SyntaxHighlighter
                                          style={vscDarkPlus as any}
                                          language={match ? match[1] : 'text'}
                                          PreTag="div"
                                          customStyle={{ margin: 0, padding: '12px', fontSize: '13px', background: 'transparent' }}
                                          {...rest}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      </div>
                                    );
                                  }
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                        
                        {msg.role === "ai" && !isLoading && msg.id !== "guest-welcome" && msg.id !== "error-auth" && (
                          <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-60 hover:opacity-100 transition-opacity">
                            <button onClick={() => handleFeedback(msg.id, "up")} className={`p-1 rounded transition-colors ${msg.feedback === "up" ? "text-green-600 bg-green-100" : "text-gray-500 hover:text-green-600 hover:bg-green-50"}`}>
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleFeedback(msg.id, "down")} className={`p-1 rounded transition-colors ${msg.feedback === "down" ? "text-red-600 bg-red-100" : "text-gray-500 hover:text-red-600 hover:bg-red-50"}`}>
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {isThinking && (
                  <div className="flex gap-2 flex-row">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
                    <div className="flex items-center rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">AI đang suy nghĩ...</span></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-gray-100 bg-white p-3 flex flex-col gap-2">
              {!isLoading && isLoggedIn && (
                <div className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                  {getQuickReplies(currentView).map((reply, idx) => (
                    <button key={idx} onClick={() => handleSend(reply)} disabled={isLoading} className="whitespace-nowrap rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50">
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input placeholder={isLoggedIn ? "Hỏi gợi ý tại đây..." : "Vui lòng đăng nhập để chat..."} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading || !isLoggedIn} className="flex-1 rounded-full border-gray-200 bg-gray-50 focus-visible:ring-primary/50" />
                <Button size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={() => handleSend()} disabled={!inputValue.trim() || isLoading || !isLoggedIn}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
              <div className="mt-1 text-center text-[10px] text-gray-400 font-medium">TagEdu AI chỉ định hướng tư duy, tuyệt đối không giải hộ.</div>
            </div>
          </div>
        )}

        <Button size="icon" className={`h-14 w-14 rounded-full shadow-xl transition-transform hover:scale-110 ${isOpen ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground"}`} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </div>

      {/* [MỚI] Giao diện Hộp thoại Xác nhận Xóa Chat nằm ĐỘC LẬP ngoài khung chat */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Xóa cuộc trò chuyện?</h3>
            <p className="mb-6 text-sm text-gray-500">Toàn bộ lịch sử tin nhắn sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setIsClearModalOpen(false)}>Hủy bỏ</Button>
              <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={confirmClearChat}>Xóa ngay</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}