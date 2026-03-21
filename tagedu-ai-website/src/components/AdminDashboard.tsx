import { useState, useEffect } from "react";
import { Users, MessageSquare, Trash2, ShieldAlert, Loader2, ChevronLeft, ChevronRight, AlertTriangle, Target, Eye, X, Bot, User as UserIcon } from "lucide-react"; 
import { Button } from "./ui/button";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AdminDashboard() {
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
      setErrorMsg("Có lỗi xảy ra khi tải dữ liệu quản trị.");
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

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setChatLogs(await res.json());
      } else {
        alert("Có lỗi xảy ra khi lấy lịch sử chat.");
      }
    } catch (error) {
      alert("Lỗi kết nối server khi tải lịch sử chat.");
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
        alert("Có lỗi xảy ra khi xóa."); 
      }
    } catch (error) {
      alert("Lỗi kết nối server.");
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const totalPages = Math.ceil(users.length / usersPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <>
      <div className="container mx-auto px-4 py-8 mt-16 max-w-5xl relative">
        <div className="mb-8 flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Quản trị</h1>
        </div>

        {errorMsg && <div className="mb-4 text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">{errorMsg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-shadow hover:shadow-md">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng số Học viên</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-shadow hover:shadow-md">
            <div className="bg-green-100 p-4 rounded-xl text-green-600">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tổng tin nhắn (Học viên gửi)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">Quản lý Tài khoản</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Tên hiển thị</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Vai trò</th>
                  <th className="p-4 font-medium text-center">Tin nhắn</th>
                  <th className="p-4 font-medium text-center">Tiến độ</th>
                  <th className="p-4 font-medium text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((u) => {
                  const completed = u.completed_challenges || 0;
                  const totalChallenges = 2; 
                  const isDoneAll = completed === totalChallenges;

                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-500">#{u.id}</td>
                      <td className="p-4 font-medium text-gray-900">{u.full_name}</td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                          <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                          {u.message_count || 0}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {u.role !== 'admin' ? (
                          <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                            isDoneAll ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            <Target className="h-3.5 w-3.5" />
                            {completed}/{totalChallenges}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {u.role !== 'admin' && (
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => viewUserLogs(u.id, u.full_name)} 
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title={`Xem lịch sử chat AI của ${u.full_name}`}
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => confirmDeleteUser(u.id, u.full_name)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa tài khoản này"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
              <span className="text-sm text-gray-500">
                Đang hiển thị <span className="font-semibold text-gray-900">{indexOfFirstUser + 1}</span> đến <span className="font-semibold text-gray-900">{Math.min(indexOfLastUser, users.length)}</span> trong tổng số <span className="font-semibold text-gray-900">{users.length}</span> tài khoản
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === number 
                        ? 'bg-primary text-white' 
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL GIÁM SÁT LỊCH SỬ CHAT AI */}
      {isLogsModalOpen && selectedUserForLogs && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 p-4">
          <div className="w-full max-w-2xl h-full max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">TagEdu AI</h3>
                  <p className="text-sm text-gray-500 font-medium">Lịch sử của: <strong className="text-gray-900">{selectedUserForLogs.name}</strong></p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogsModalOpen(false)} 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb] space-y-6">
              {isLogsLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-primary">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <p className="font-medium text-sm text-muted-foreground">Đang tải lịch sử hội thoại...</p>
                </div>
              ) : chatLogs.length > 0 ? (
                chatLogs.map((log) => {
                  const isAI = log.role === 'ai';
                  const msgTime = new Date(log.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

                  return (
                    <div key={log.id} className={`flex gap-3 w-full ${isAI ? 'justify-start' : 'justify-end'}`}>
                      {/* Avatar AI */}
                      {isAI && (
                        <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full mt-1 bg-primary text-white shadow-md">
                          <Bot className="h-5 w-5" />
                        </div>
                      )}
                      
                      {/* Bong bóng tin nhắn sử dụng ReactMarkdown */}
                      <div className={`flex flex-col gap-1 max-w-[85%] ${isAI ? 'items-start' : 'items-end'}`}>
                        <div 
                          className={`text-sm leading-relaxed px-5 py-3.5 shadow-sm ${
                            isAI 
                              ? 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100' 
                              : 'bg-primary text-white rounded-2xl rounded-tr-sm'
                          }`}
                        >
                           <div className="prose prose-sm max-w-none text-left prose-p:leading-relaxed prose-p:m-0 prose-ul:m-0 prose-ul:pl-5">
                             <ReactMarkdown
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                                  li: ({node, ...props}) => <li className="pl-1" {...props} />
                                }}
                             >
                               {log.content}
                             </ReactMarkdown>
                           </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium px-2">{msgTime}</span>
                      </div>

                      {/* Avatar User */}
                      {!isAI && (
                        <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full mt-1 bg-blue-100 text-blue-700 shadow-sm border border-blue-200">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 p-8">
                  <MessageSquare className="h-14 w-14" />
                  <p className="font-semibold text-lg">Tài khoản này chưa có lịch sử chat với AI.</p>
                  <p className="text-sm text-gray-500">Học viên chưa bắt đầu cuộc trò chuyện nào trên TagEdu.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Xóa vĩnh viễn tài khoản?</h3>
            <p className="mb-6 text-sm text-gray-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa người dùng <strong className="text-gray-900">"{userToDelete.name}"</strong> không?<br/>
              Toàn bộ dữ liệu và lịch sử trò chuyện của tài khoản này sẽ bị xóa sạch và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </Button>
              <Button 
                className="flex flex-1 items-center justify-center rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                onClick={executeDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isDeleting ? "Đang xóa..." : "Vâng, xóa ngay!"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}