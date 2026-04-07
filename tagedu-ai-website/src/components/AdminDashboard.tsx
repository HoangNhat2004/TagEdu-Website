import { useState, useEffect } from "react";
import { Users, MessageSquare, Trash2, ShieldAlert, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Target, Eye, X, Bot, User as UserIcon, ThumbsUp, ThumbsDown, Search } from "lucide-react"; 
import { Button } from "./ui/button";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/lib/i18n";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState({ totalUsers: 0, totalMessages: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; 

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State cho tính năng Giám sát lịch sử Chat AI
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<{ id: number; name: string } | null>(null);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("landing");

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");

  const token = localStorage.getItem("tagedu_token");

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(""); 
    try {
      const resStats = await fetch(`${API_URL}/admin/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resStats.ok) setStats(await resStats.json());

      const resUsers = await fetch(`${API_URL}/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resUsers.ok) setUsers(await resUsers.json());

    } catch (error) {
      setErrorMsg(t("admin.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const viewUserLogs = async (userId: number, userName: string) => {
    setSelectedUserForLogs({ id: userId, name: userName });
    setIsLogsModalOpen(true);
    setIsLogsLoading(true);
    setChatLogs([]);
    setActiveTab("landing");
    setChatSearch("");

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setChatLogs(await res.json());
      } else {
        alert(t("admin.chatLogError"));
      }
    } catch (error) {
      alert(t("admin.chatLogNetworkError"));
    } finally {
      setIsLogsLoading(false);
    }
  };

  const confirmDeleteUser = (id: number, name: string) => {
    setUserToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchData(); 
      } else {
        alert(t("admin.deleteError")); 
      }
    } catch (error) {
      alert(t("admin.deleteNetworkError"));
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [userSearch]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (isLoading) return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="h-10 w-10 animate-spin text-cyan-500 drop-shadow-[0_0_15px_rgba(0,212,255,0.6)]" /></div>;

  return (
    <>
      <div className="container mx-auto px-4 py-8 mt-16 max-w-5xl relative z-10">
        <div className="mb-8 flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">{t("admin.title")}</h1>
        </div>

        {errorMsg && <div className="mb-4 text-red-200 bg-red-900/40 p-3 rounded-lg border border-red-500/50 backdrop-blur-sm">{errorMsg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="glass-card p-6 rounded-2xl flex items-center gap-4 transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.15)] group">
            <div className="bg-cyan-500/20 p-4 rounded-xl text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-cyan-100 font-medium">{t("admin.totalStudents")}</p>
              <p className="text-3xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl flex items-center gap-4 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] group">
            <div className="bg-purple-500/20 p-4 rounded-xl text-purple-400 border border-purple-500/30 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-purple-100 font-medium">{t("admin.totalMessages")}</p>
              <p className="text-3xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">{stats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-lg font-bold text-white shrink-0 tracking-wide">{t("admin.accountManagement")}</h2>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70" />
              <input
                type="text"
                placeholder={t("admin.searchPlaceholder")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#131b2f] py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#0a0e1a]/80 text-gray-400 text-sm border-b border-white/10">
                  <th className="p-4 font-semibold tracking-wider">{t("admin.colId")}</th>
                  <th className="p-4 font-semibold tracking-wider">{t("admin.colName")}</th>
                  <th className="p-4 font-semibold tracking-wider">{t("admin.colEmail")}</th>
                  <th className="p-4 font-semibold tracking-wider">{t("admin.colRole")}</th>
                  <th className="p-4 font-semibold text-center tracking-wider">{t("admin.colMessages")}</th>
                  <th className="p-4 font-semibold text-center tracking-wider">{t("admin.colProgress")}</th>
                  <th className="p-4 font-semibold text-center tracking-wider">{t("admin.colActions")}</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/5">
                {currentUsers.map((u) => {
                  const completed = u.completed_challenges || 0;
                  const totalChallenges = 2;
                  const isDoneAll = completed === totalChallenges;
                  return (
                    <tr key={u.id} className="hover:bg-cyan-900/20 transition-colors">
                      <td className="p-4 text-gray-400 font-mono">#{u.id}</td>
                      <td className="p-4 font-bold text-white">{u.full_name}</td>
                      <td className="p-4 text-gray-300">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border 
                          ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'bg-blue-500/20 text-cyan-300 border-blue-500/30'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-bold">
                          <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                          {u.message_count || 0}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                          isDoneAll ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}>
                          <Target className="h-3.5 w-3.5" />
                          {completed}/{totalChallenges}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => viewUserLogs(u.id, u.full_name)} className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors border border-transparent hover:border-cyan-500/30" title={t("admin.viewChatHistory").replace("{name}", u.full_name)}>
                            <Eye className="h-5 w-5" />
                          </button>
                          <button onClick={() => confirmDeleteUser(u.id, u.full_name)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30" title={t("admin.deleteAccount")}>
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-white/10 bg-transparent">
            {currentUsers.map((u) => {
              const completed = u.completed_challenges || 0;
              const totalChallenges = 2;
              const isDoneAll = completed === totalChallenges;
              return (
                <div key={u.id} className="p-4 hover:bg-cyan-900/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{u.full_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border
                          ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-cyan-300 border-blue-500/30'}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 truncate">{u.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">#{u.id}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => viewUserLogs(u.id, u.full_name)} className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button onClick={() => confirmDeleteUser(u.id, u.full_name)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-bold">
                      <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                      {u.message_count || 0} {t("admin.messages")}
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      isDoneAll ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}>
                      <Target className="h-3.5 w-3.5" />
                      {completed}/{totalChallenges} {t("admin.challenges")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 backdrop-blur-md">
              <span className="text-sm text-gray-400 text-center sm:text-left">
                {t("admin.showing")} <span className="font-bold text-white">{indexOfFirstUser + 1}</span>–<span className="font-bold text-white">{Math.min(indexOfLastUser, filteredUsers.length)}</span> {t("admin.of")} <span className="font-bold text-white">{filteredUsers.length}</span> {t("admin.accounts")}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                      currentPage === number 
                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]' 
                        : 'border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL GIÁM SÁT LỊCH SỬ CHAT AI */}
      {isLogsModalOpen && selectedUserForLogs && (() => {
        const TABS = [
          { key: "landing",    label: t("admin.tabHome") },
          { key: "challenge7", label: t("admin.tabChallenge1") },
          { key: "challenge8", label: t("admin.tabChallenge2") },
        ];

        const filteredLogs = chatLogs
          .filter(log => log.challenge_id === activeTab)
          .filter(log => chatSearch === "" || log.content?.toLowerCase().includes(chatSearch.toLowerCase()));

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300 p-4">
            <div className="w-full max-w-2xl h-full max-h-[90vh] flex flex-col rounded-2xl glass-card shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-white/10">

              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 bg-black/50 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400 border border-cyan-500/30">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gradient-cyan drop-shadow-[0_0_5px_rgba(0,212,255,0.4)]">TagEdu AI</h3>
                    <p className="text-sm text-gray-400 font-medium">{t("admin.chatHistoryOf")} <strong className="text-white">"{selectedUserForLogs.name}"</strong></p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLogsModalOpen(false)}
                  className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center border-b border-white/10 bg-[#0a0e1a]/80 px-4 shrink-0 gap-2 overflow-x-auto">
                <div className="flex flex-1 min-w-max">
                  {TABS.map(tab => {
                    const count = chatLogs.filter(l => l.challenge_id === tab.key && l.role === 'user').length;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setChatSearch(""); }}
                        className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-bold tracking-wide transition-colors
                          ${activeTab === tab.key
                            ? 'text-cyan-400 border-b-2 border-cyan-400 drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]'
                            : 'text-gray-500 hover:text-gray-300'
                          }`}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold
                            ${activeTab === tab.key ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search trong chat */}
              <div className="px-4 py-2.5 bg-[#0a0e1a]/95 border-b border-white/10 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/70" />
                  <input
                    type="text"
                    placeholder={t("admin.searchMessages")}
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#131b2f] py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-inner transition"
                  />
                </div>
              </div>

              {/* Messages Area - Dark Mode */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#0a0e1a]/60 space-y-6">
                {isLogsLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-cyan-400">
                    <Loader2 className="h-10 w-10 animate-spin drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
                    <p className="font-medium text-sm text-cyan-200 uppercase tracking-widest">{t("admin.loadingHistory")}</p>
                  </div>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isAI = log.role === 'ai';
                    const msgTime = new Date(log.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

                    return (
                      <div key={log.id} className={`flex gap-3 w-full ${isAI ? 'justify-start' : 'justify-end'}`}>
                        {isAI && (
                          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full mt-1 bg-[#131b2f] text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,212,255,0.15)]">
                            <Bot className="h-5 w-5" />
                          </div>
                        )}

                        <div className={`flex flex-col gap-1 max-w-[85%] ${isAI ? 'items-start' : 'items-end'}`}>
                          <div className={`text-sm leading-relaxed px-5 py-3.5 shadow-sm ${
                            isAI
                              ? 'bg-[#131b2f] text-gray-200 rounded-2xl rounded-tl-sm border border-white/5 shadow-[0_4px_10px_rgba(0,0,0,0.3)]'
                              : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm shadow-[0_4px_15px_rgba(0,212,255,0.15)]'
                          }`}>
                            <div className={`prose prose-sm max-w-none text-left prose-p:leading-relaxed prose-p:m-0 prose-ul:m-0 prose-ul:pl-5 ${isAI ? 'prose-invert prose-strong:text-white' : 'prose-strong:text-white'}`}>
                              <ReactMarkdown
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold tracking-wide" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-cyan-200" {...props} />,
                                  li: ({node, ...props}) => <li className="pl-1" {...props} />
                                }}
                              >
                                {log.content}
                              </ReactMarkdown>
                            </div>
                          </div>

                          {/* Feedback badge */}
                          {isAI && log.feedback && (
                            <div className="flex items-center gap-1.5 ml-1 mt-1 opacity-80">
                              {log.feedback === 'up' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-1 text-xs font-bold text-green-400">
                                  <ThumbsUp className="h-3.5 w-3.5" /> {t("admin.feedbackHelpful")}
                                </span>
                              )}
                              {log.feedback === 'down' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400">
                                  <ThumbsDown className="h-3.5 w-3.5" /> {t("admin.feedbackNotHelpful")}
                                </span>
                              )}
                            </div>
                          )}

                          <span className="text-[10px] text-gray-500 font-mono font-medium px-2 py-0.5">{msgTime}</span>
                        </div>

                        {!isAI && (
                          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full mt-1 bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 shadow-inner">
                            <UserIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 bg-[#131b2f]/50 rounded-xl border border-dashed border-white/10 p-8 backdrop-blur-sm">
                    <MessageSquare className="h-14 w-14 text-white/10" />
                    <p className="font-bold text-lg text-gray-300">
                      {chatSearch ? t("admin.noResults").replace("{query}", chatSearch) : t("admin.noMessages")}
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm text-center leading-relaxed">
                      {chatSearch ? t("admin.tryOtherKeyword") : t("admin.studentNotChatted").replace("{tab}", TABS.find(tb => tb.key === activeTab)?.label || "")}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL XÓA USER */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300 p-4">
          <div className="w-full max-w-md rounded-2xl glass-card p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in fade-in zoom-in-95 duration-200 border border-white/10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner">
              <AlertTriangle className="h-8 w-8 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">{t("admin.deleteUserTitle")}</h3>
            <p className="mb-8 text-sm text-gray-400 leading-relaxed">
              {t("admin.deleteUserMsg1")} <strong className="text-white text-base">"{userToDelete.name}"</strong>?<br/>
              <span className="text-red-400 mt-2 block">{t("admin.deleteUserMsg2")}</span>
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline"
                className="flex-1 rounded-xl border-white/10 bg-white/5 py-6 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                {t("admin.cancelBtn")}
              </Button>
              <Button 
                className="flex flex-1 items-center justify-center rounded-xl bg-red-600/90 py-6 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500/50 transition-all hover:scale-105"
                onClick={executeDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isDeleting ? t("admin.deletingBtn") : t("admin.confirmDeleteBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}