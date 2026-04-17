import { useState, useEffect } from "react";
import { X, Mail, User as UserIcon, Loader2, UserCog, BookUser, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onSuccess: (updatedUser: any) => void;
}

/* Dark input styling — bright text, visible on dark bg */
const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors";

const inputClassSimple =
  "w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors";

const inputClassDisabled =
  "w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-gray-400 cursor-not-allowed";

export function ProfileModal({ isOpen, onClose, currentUser, onSuccess }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { t, language } = useI18n();

  const [formData, setFormData] = useState({
    fullName: "",
    profileBio: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({ 
        fullName: currentUser.fullName || currentUser.full_name || "",
        profileBio: currentUser.profileBio || "", 
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrorMsg("");
      setSuccessMsg("");
      setActiveTab('profile');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    const token = localStorage.getItem("tagedu_token");

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          full_name: formData.fullName, 
          profileBio: formData.profileBio,
          language 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(t("profile.profileUpdated"));
        
        const updatedUser = { 
          ...currentUser, 
          fullName: formData.fullName, 
          full_name: formData.fullName,
          profileBio: formData.profileBio 
        };
        localStorage.setItem("tagedu_user", JSON.stringify(updatedUser));
        onSuccess(updatedUser);
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || t("auth.error"));
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMsg(t("profile.fillAll"));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg(t("profile.passwordMismatch"));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMsg(t("profile.passwordMinLength"));
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("tagedu_token");

    try {
      const response = await fetch(`${API_URL}/users/password`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          currentPassword: passwordData.currentPassword, 
          newPassword: passwordData.newPassword,
          language 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(t("profile.passwordChanged"));
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || t("auth.error"));
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full p-1 text-gray-400 hover:bg-white/10 transition-colors">
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center" style={{ background: 'rgba(0, 212, 255, 0.03)' }}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <UserCog className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t("profile.title")}</h2>
          <p className="mt-2 text-sm text-gray-400">{t("profile.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'profile' ? 'border-b-2 border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => { setActiveTab('profile'); setErrorMsg(""); setSuccessMsg(""); }}
          >
            <UserIcon className="h-4 w-4" /> {t("profile.infoTab")}
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'password' ? 'border-b-2 border-cyan-400 text-cyan-400 bg-cyan-500/5' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => { setActiveTab('password'); setErrorMsg(""); setSuccessMsg(""); }}
          >
            <Shield className="h-4 w-4" /> {t("profile.passwordTab")}
          </button>
        </div>

        {/* Form area */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" /> <p>{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-400 border border-green-500/20 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> <p>{successMsg}</p>
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4 pb-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">{t("profile.emailLabel")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input type="email" value={currentUser?.email || ""} disabled className={inputClassDisabled} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">{t("profile.displayName")}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input type="text" name="fullName" placeholder={t("profile.displayNamePlaceholder")} required value={formData.fullName} onChange={handleProfileChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">{t("profile.bioLabel")}</label>
                <div className="relative">
                  <BookUser className="absolute left-3 top-4 h-5 w-5 text-gray-500" />
                  <textarea 
                    name="profileBio" 
                    placeholder={t("profile.bioPlaceholder")}
                    value={formData.profileBio} 
                    onChange={handleProfileChange}
                    rows={4} 
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors leading-relaxed resize-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 font-medium">{t("profile.bioHint")}</p>
              </div>

              <button type="submit" disabled={isLoading || !!successMsg || !formData.fullName.trim()} className="mt-4 flex w-full items-center justify-center rounded-lg btn-cosmic py-2.5 text-sm font-semibold disabled:opacity-70">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("profile.saveChanges")}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pb-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">{t("profile.currentPassword")}</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={inputClassSimple}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">{t("profile.newPassword")}</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={inputClassSimple}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-300">{t("profile.confirmPassword")}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={inputClassSimple}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={isLoading || !!successMsg} className="mt-4 flex w-full items-center justify-center rounded-lg btn-cosmic py-2.5 text-sm font-semibold disabled:opacity-70">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("profile.passwordTab")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}