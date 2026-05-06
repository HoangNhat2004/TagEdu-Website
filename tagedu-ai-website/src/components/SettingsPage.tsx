import { useState, useEffect } from "react";
import { Globe, Shield, Download, Trash2, Loader2, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Child {
  id: number;
  full_name: string;
  email: string;
}

export function SettingsPage() {
  const { t, language, setLanguage } = useI18n();

  // Guardian privacy state
  const userStr = localStorage.getItem("tagedu_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isGuardian = user?.role === "guardian";

  const [children, setChildren] = useState<Child[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [exportingChildId, setExportingChildId] = useState<number | null>(null);
  const [childToDeleteData, setChildToDeleteData] = useState<Child | null>(null);
  const [isDeletingData, setIsDeletingData] = useState(false);

  useEffect(() => {
    if (isGuardian) fetchChildren();
  }, [isGuardian]);

  const fetchChildren = async () => {
    setIsLoadingChildren(true);
    const token = localStorage.getItem("tagedu_token");
    try {
      const res = await fetch(`${API_URL}/guardian/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
      }
    } catch (err) {
      console.error("Error fetching children:", err);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const handleExportData = async (child: Child) => {
    setExportingChildId(child.id);
    const token = localStorage.getItem("tagedu_token");
    try {
      const res = await fetch(`${API_URL}/guardian/children/${child.id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();

      // Trigger download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tagedu_data_${child.full_name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("privacy.exportSuccess"));
    } catch (err) {
      toast.error(t("privacy.exportError"));
    } finally {
      setExportingChildId(null);
    }
  };

  const handleDeleteAllData = async () => {
    if (!childToDeleteData) return;
    setIsDeletingData(true);
    const token = localStorage.getItem("tagedu_token");
    try {
      const res = await fetch(`${API_URL}/guardian/children/${childToDeleteData.id}/data`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");

      toast.success(t("privacy.deleteSuccess"));
      setChildToDeleteData(null);
      fetchChildren(); // Refresh list
    } catch (err) {
      toast.error(t("privacy.deleteError"));
    } finally {
      setIsDeletingData(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] cosmic-bg py-12 md:py-20">
      <div className="container px-4 md:px-8 mx-auto max-w-3xl relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
            {t("settings.title")}
          </h1>
          <p className="text-gray-400 text-lg">{t("settings.subtitle")}</p>
        </div>

        <div className="space-y-6">
          {/* Language Setting */}
          <div className="glass-card p-6 rounded-2xl border border-cyan-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t("settings.language")}</h3>
                <p className="text-sm text-gray-400">{t("settings.languageDesc")}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage("en")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  language === "en"
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                    : "bg-transparent border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                }`}
              >
                🇺🇸 English
              </button>
              <button
                onClick={() => setLanguage("vi")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  language === "vi"
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                    : "bg-transparent border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                }`}
              >
                🇻🇳 Tiếng Việt
              </button>
            </div>
          </div>

          {/* ====== PRIVACY & DATA CONTROLS (Guardian only) ====== */}
          {isGuardian && (
            <div className="glass-card p-6 rounded-2xl border border-amber-500/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t("privacy.title")}</h3>
                  <p className="text-sm text-gray-400">{t("privacy.subtitle")}</p>
                </div>
              </div>

              {/* COPPA/GDPR notice */}
              <div className="mt-4 mb-5 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3.5">
                <p className="text-xs text-amber-400/80 leading-relaxed">
                  <Shield className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                  {t("privacy.notice")}
                </p>
              </div>

              {/* Children data list */}
              {isLoadingChildren ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                </div>
              ) : children.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t("privacy.noChildren")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-cyan-400">{child.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{child.full_name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{child.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {/* Export button */}
                        <button
                          onClick={() => handleExportData(child)}
                          disabled={exportingChildId === child.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                          title={t("privacy.exportBtn")}
                        >
                          {exportingChildId === child.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          {t("privacy.exportBtn")}
                        </button>
                        {/* Delete all data button */}
                        <button
                          onClick={() => setChildToDeleteData(child)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                          title={t("privacy.deleteBtn")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("privacy.deleteBtn")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ====== DELETE CONFIRMATION MODAL ====== */}
      {childToDeleteData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm glass-card border-red-500/20 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t("privacy.deleteTitle")}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t("privacy.deleteWarning")}
              </p>
              <p className="mt-3 text-red-400 font-semibold">"{childToDeleteData.full_name}"</p>
              <div className="mt-4 rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                <p className="text-[11px] text-red-400/80 leading-relaxed">
                  <AlertTriangle className="h-3 w-3 inline mr-1 -mt-0.5" />
                  {t("privacy.deleteIrreversible")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setChildToDeleteData(null)}
                disabled={isDeletingData}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
              >
                {t("nav.cancel")}
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={isDeletingData}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingData ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("privacy.confirmDelete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
