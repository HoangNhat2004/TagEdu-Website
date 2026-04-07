import { useState, useEffect } from "react";
import { X, Mail, Lock, User as UserIcon, Loader2, LogIn, KeyRound } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useI18n } from "@/lib/i18n";

const GOOGLE_CLIENT_ID = "684563079412-cvcos2eie48j5bv4r95sjlihfdfko7fm.apps.googleusercontent.com";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

/* Shared input style — dark background, bright text, cyan focus */
const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors";

const inputClassDisabled =
  "w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-gray-400 cursor-not-allowed";

/* Custom Google Login button — uses useGoogleLogin hook so we control the label text */
function GoogleLoginButton({ onSuccess, onError, label }: { onSuccess: (res: any) => void; onError: () => void; label: string }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Exchange the access token for credential via Google's userinfo
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        // Pass as a compatible format for our backend
        onSuccess({ credential: tokenResponse.access_token, userInfo });
      } catch {
        onError();
      }
    },
    onError: () => onError(),
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  );
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { t, language } = useI18n();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    otp: "",
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, language]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = (newMode: "login" | "register" | "forgot") => {
    setMode(newMode);
    setErrorMsg("");
    setSuccessMsg("");
    setForgotStep(1);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    const isLogin = mode === "login";
    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
    
    const payload = isLogin 
      ? { email: formData.email, password: formData.password, language }
      : { fullName: formData.fullName, email: formData.email, password: formData.password, language };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem("tagedu_token", data.token);
          localStorage.setItem("tagedu_user", JSON.stringify(data.user));
          onSuccess(data.user); 
          onClose(); 
        } else {
          setSuccessMsg(t("auth.registerSuccess"));
          setTimeout(() => switchMode("login"), 1500);
        }
      } else {
        throw new Error(data.error || t("auth.error"));
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, language }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(t("auth.otpSent"));
        setForgotStep(2);
      } else throw new Error(data.error);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp, newPassword: formData.password, language }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(t("auth.passwordChanged"));
        setTimeout(() => switchMode("login"), 2000);
      } else throw new Error(data.error);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`${API_URL}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential, language }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("tagedu_token", data.token);
        localStorage.setItem("tagedu_user", JSON.stringify(data.user));
        onSuccess(data.user); 
        onClose(); 
      } else throw new Error(data.error);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} key={language}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-white/10 transition-colors z-10">
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center" style={{ background: 'rgba(0, 212, 255, 0.03)' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {mode === "forgot" ? <KeyRound className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {mode === "login" ? t("auth.welcomeBack") : mode === "register" ? t("auth.createAccount") : t("auth.resetPassword")}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {mode === "forgot" ? t("auth.forgotSubtitle") : t("auth.loginSubtitle")}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {errorMsg && <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{errorMsg}</div>}
            {successMsg && <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400 border border-green-500/20">{successMsg}</div>}

            {mode === "forgot" ? (
              <form onSubmit={forgotStep === 1 ? handleSendOTP : handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input type="email" name="email" placeholder={t("auth.emailPlaceholder")} required disabled={forgotStep === 2} value={formData.email} onChange={handleChange} className={forgotStep === 2 ? inputClassDisabled : inputClass} />
                </div>

                {forgotStep === 2 && (
                  <>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <input type="text" name="otp" placeholder={t("auth.otpPlaceholder")} required value={formData.otp} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <input type="password" name="password" placeholder={t("auth.newPasswordPlaceholder")} required minLength={6} value={formData.password} onChange={handleChange} className={inputClass} />
                    </div>
                  </>
                )}

                <button type="submit" disabled={isLoading} className="mt-2 flex w-full items-center justify-center rounded-lg btn-cosmic py-2.5 text-sm font-semibold disabled:opacity-70">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (forgotStep === 1 ? t("auth.sendOtp") : t("auth.changePasswordBtn"))}
                </button>
                
                <div className="text-center mt-4">
                  <button type="button" onClick={() => switchMode("login")} className="text-sm font-semibold text-gray-400 hover:text-cyan-400 transition-colors">
                    {t("auth.backToLogin")}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {mode === "register" && (
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <input type="text" name="fullName" placeholder={t("auth.fullNamePlaceholder")} required value={formData.fullName} onChange={handleChange} className={inputClass} />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input type="email" name="email" placeholder={t("auth.emailPlaceholder")} required value={formData.email} onChange={handleChange} className={inputClass} />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input type="password" name="password" placeholder={t("auth.passwordPlaceholder")} required minLength={6} value={formData.password} onChange={handleChange} className={inputClass} />
                  </div>

                  {mode === "login" && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                        {t("auth.forgotPassword")}
                      </button>
                    </div>
                  )}

                  <button type="submit" disabled={isLoading} className="mt-2 flex w-full items-center justify-center rounded-lg btn-cosmic py-2.5 text-sm font-semibold disabled:opacity-70">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === "login" ? t("auth.loginBtn") : t("auth.registerBtn"))}
                  </button>
                </form>

                <div className="mt-5 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-white/10 after:mt-0.5 after:flex-1 after:border-t after:border-white/10">
                  <p className="mx-4 mb-0 text-center text-sm text-gray-500">{t("auth.or")}</p>
                </div>
                
                <div className="mt-5 flex justify-center">
                  <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={() => setErrorMsg(t("auth.googleFailed"))} label={t("auth.loginWithGoogle")} />
                </div>

                <div className="mt-6 text-center text-sm text-gray-400">
                  {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
                  <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                    {mode === "login" ? t("auth.registerNow") : t("auth.loginHere")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}