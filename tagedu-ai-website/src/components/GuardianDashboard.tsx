import { useState, useEffect } from "react";
import { UserPlus, Users, BarChart3, Trash2, Calendar, Mail, Lock, X, Loader2, ChevronRight, GraduationCap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Child {
  id: number;
  full_name: string;
  email: string;
  date_of_birth: string;
}

export function GuardianDashboard() {
  const { t, language } = useI18n();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  
  const [newChild, setNewChild] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getMaxDays = () => {
    if (!month || !year) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  };
  const days = Array.from({ length: getMaxDays() }, (_, i) => i + 1);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchChildren();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newChild.full_name.trim()) errors.full_name = t("auth.validation.nameRequired");
    if (!newChild.email.trim()) errors.email = t("auth.validation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newChild.email)) errors.email = t("auth.validation.emailInvalid");
    if (!newChild.password) errors.password = t("auth.validation.passwordRequired");
    else if (newChild.password.length < 6) errors.password = t("auth.validation.passwordMin");
    if (!day || !month || !year) {
      errors.date_of_birth = t("onboarding.invalidDate");
    } else {
      const dob = new Date(Number(year), Number(month) - 1, Number(day));
      const now = new Date();
      const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 0) {
        errors.date_of_birth = t("auth.validation.futureDate");
      } else if (age < 5 || age > 18) {
        errors.date_of_birth = t("auth.validation.ageMinMax");
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchChildren = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("tagedu_token");
    try {
      const res = await fetch(`${API_URL}/guardian/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
        
        // [CẢI TIẾN] Khôi phục hồ sơ con đã chọn trước đó từ session
        const savedChildId = sessionStorage.getItem("tagedu_selected_child_id");
        if (savedChildId && data.length > 0) {
          const found = data.find((c: Child) => c.id.toString() === savedChildId);
          if (found) setSelectedChild(found);
        }
      }
    } catch (err) {
      console.error("Error fetching children:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!validateForm()) return;
    
    const dobStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    setIsLoading(true);
    const token = localStorage.getItem("tagedu_token");
    try {
      const res = await fetch(`${API_URL}/guardian/children`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...newChild, date_of_birth: dobStr, language }),
      });
      if (res.ok) {
        toast.success(t("guardian.addChildSuccess"));
        setIsAddModalOpen(false);
        setNewChild({ full_name: "", email: "", password: "" });
        setDay("");
        setMonth("");
        setYear("");
        fetchChildren();
      } else {
        const err = await res.json();
        setErrorMsg(err.error);
      }
    } catch (err) {
      setErrorMsg("Error creating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChild = async (childId: number) => {
    const token = localStorage.getItem("tagedu_token");
    try {
      const res = await fetch(`${API_URL}/guardian/children/${childId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Profile removed");
        setChildToDelete(null);
        fetchChildren();
        if (selectedChild?.id === childId) {
          setSelectedChild(null);
          sessionStorage.removeItem("tagedu_selected_child_id");
        }
      }
    } catch (err) {
      toast.error("Error removing profile");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-cyan-400" />
            {t("guardian.title")}
          </h1>
          <p className="text-gray-400 mt-1">{t("guardian.subtitle")}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-cosmic px-6 py-2.5 flex items-center gap-2 self-start"
        >
          <UserPlus className="h-5 w-5" />
          {t("guardian.addChild")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Child List */}
        <div className="lg:col-span-1 space-y-4">
          {isLoading && children.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : children.length === 0 ? (
            <div className="glass-card p-8 text-center border-dashed border-white/10">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">{t("guardian.noChildren")}</p>
            </div>
          ) : (
            children.map((child) => (
              <div 
                key={child.id}
                onClick={() => {
                  setSelectedChild(child);
                  sessionStorage.setItem("tagedu_selected_child_id", child.id.toString());
                }}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                  (selectedChild && selectedChild.id === child.id) 
                    ? "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center border transition-colors ${
                    (selectedChild && selectedChild.id === child.id) ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" : "bg-white/10 border-white/10 text-gray-400"
                  }`}>
                    <span className="text-lg font-bold">{child.full_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{child.full_name}</h3>
                    <p className="text-gray-500 text-xs truncate">{child.email}</p>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-transform ${
                    (selectedChild && selectedChild.id === child.id) ? "text-cyan-400 translate-x-1" : "text-gray-600"
                  }`} />
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setChildToDelete(child); }}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right: Child Analytics */}
        <div className="lg:col-span-2">
          {selectedChild ? (
            <div className="glass-card p-6 border-white/10 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">
                    {t("guardian.reportTitle").replace("{name}", selectedChild.full_name)}
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    setSelectedChild(null);
                    sessionStorage.removeItem("tagedu_selected_child_id");
                  }}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                  title={t("nav.cancel")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AnalyticsDashboard childId={selectedChild.id} />
            </div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center p-12 text-center opacity-50">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <BarChart3 className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t("guardian.selectToView")}</h3>
              <p className="text-gray-400 max-w-xs">{t("guardian.selectDesc")}</p>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md glass-card border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => { setIsAddModalOpen(false); setFieldErrors({}); setErrorMsg(""); }} className="absolute right-4 top-4 text-gray-500 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 border border-cyan-500/20">
                <UserPlus className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t("guardian.addChild")}</h2>
              <p className="text-gray-400 text-sm mt-1">{t("guardian.addChildDesc")}</p>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4" noValidate>
              {errorMsg && <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{errorMsg}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">{t("guardian.childName")}</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input 
                    type="text" 
                    className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-4 text-white focus:border-cyan-500/50 outline-none transition-all ${
                      fieldErrors.full_name ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                    }`}
                    placeholder="E.g. Captain Nemo"
                    value={newChild.full_name}
                    onChange={(e) => {
                      setNewChild({...newChild, full_name: e.target.value});
                      if (fieldErrors.full_name) setFieldErrors({...fieldErrors, full_name: ""});
                    }}
                  />
                </div>
                {fieldErrors.full_name && <p className="text-[10px] text-red-400 ml-1 mt-1">⚠ {fieldErrors.full_name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 ml-1">{t("guardian.childEmail")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input 
                    type="email" 
                    className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-4 text-white focus:border-cyan-500/50 outline-none transition-all ${
                      fieldErrors.email ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                    }`}
                    placeholder="child@tagedu.com"
                    value={newChild.email}
                    onChange={(e) => {
                      setNewChild({...newChild, email: e.target.value});
                      if (fieldErrors.email) setFieldErrors({...fieldErrors, email: ""});
                    }}
                  />
                </div>
                {fieldErrors.email && <p className="text-[10px] text-red-400 ml-1 mt-1">⚠ {fieldErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 ml-1">{t("guardian.childPassword")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input 
                      type="password" 
                      className={`w-full bg-white/5 border rounded-xl py-3 pl-11 pr-4 text-white focus:border-cyan-500/50 outline-none transition-all ${
                        fieldErrors.password ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                      }`}
                      placeholder="••••••"
                      value={newChild.password}
                      onChange={(e) => {
                        setNewChild({...newChild, password: e.target.value});
                        if (fieldErrors.password) setFieldErrors({...fieldErrors, password: ""});
                      }}
                    />
                  </div>
                  {fieldErrors.password && <p className="text-[10px] text-red-400 ml-1 mt-1">⚠ {fieldErrors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 ml-1">{t("onboarding.birthday")}</label>
                  <div className="flex gap-2">
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className={`flex-1 bg-white/5 border rounded-xl py-3 px-3 text-white text-sm focus:border-cyan-500/50 outline-none transition-all appearance-none text-center cursor-pointer ${
                        fieldErrors.date_of_birth ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                      }`}
                    >
                      <option value="" className="bg-[#0d1117] text-gray-500">{t("onboarding.day")}</option>
                      {days.map((d) => (
                        <option key={d} value={d} className="bg-[#0d1117]">{d}</option>
                      ))}
                    </select>

                    <select
                      value={month}
                      onChange={(e) => { setMonth(e.target.value); if (Number(day) > getMaxDays()) setDay(""); }}
                      className={`flex-1 bg-white/5 border rounded-xl py-3 px-3 text-white text-sm focus:border-cyan-500/50 outline-none transition-all appearance-none text-center cursor-pointer ${
                        fieldErrors.date_of_birth ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                      }`}
                    >
                      <option value="" className="bg-[#0d1117] text-gray-500">{t("onboarding.month")}</option>
                      {months.map((m) => (
                        <option key={m} value={m} className="bg-[#0d1117]">{m}</option>
                      ))}
                    </select>

                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={`flex-1 bg-white/5 border rounded-xl py-3 px-3 text-white text-sm focus:border-cyan-500/50 outline-none transition-all appearance-none text-center cursor-pointer ${
                        fieldErrors.date_of_birth ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-white/10"
                      }`}
                    >
                      <option value="" className="bg-[#0d1117] text-gray-500">{t("onboarding.year")}</option>
                      {years.map((y) => (
                        <option key={y} value={y} className="bg-[#0d1117]">{y}</option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.date_of_birth && <p className="text-[10px] text-red-400 ml-1 mt-1">⚠ {fieldErrors.date_of_birth}</p>}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full btn-cosmic py-3 flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("guardian.addChild")}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {childToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm glass-card border-red-500/20 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t("admin.deleteUserTitle")}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t("guardian.deleteConfirm")} <br/>
                <span className="text-red-400 font-semibold mt-2 inline-block">"{childToDelete.full_name}"</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setChildToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white transition-all"
              >
                {t("admin.cancelBtn")}
              </button>
              <button 
                onClick={() => handleDeleteChild(childToDelete.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              >
                {t("admin.confirmDeleteBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
