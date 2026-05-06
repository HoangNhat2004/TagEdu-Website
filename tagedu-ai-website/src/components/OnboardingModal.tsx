import { useState } from "react";
import { Rocket, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (dateOfBirth: string) => void;
  onSkip: () => void;
}

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
  const { t, language } = useI18n();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Tính số ngày tối đa dựa trên tháng/năm đã chọn
  const getMaxDays = () => {
    if (!month || !year) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  };
  const days = Array.from({ length: getMaxDays() }, (_, i) => i + 1);

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!day || !month || !year) {
      setErrorMsg(t("onboarding.invalidDate"));
      return;
    }

    const dob = new Date(Number(year), Number(month) - 1, Number(day));
    const now = new Date();
    const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    if (age < 0) {
      setErrorMsg(t("auth.validation.futureDate"));
      return;
    }
    if (age < 5 || age > 18) {
      setErrorMsg(t("auth.validation.ageMinMax"));
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("tagedu_token");
    const dobStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    try {
      const response = await fetch(`${API_URL}/users/date-of-birth`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ dateOfBirth: dobStr, language }),
      });

      const data = await response.json();

      if (response.ok) {
        onComplete(data.dateOfBirth);
      } else {
        setErrorMsg(data.error || t("onboarding.error"));
      }
    } catch {
      setErrorMsg(t("onboarding.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass =
    "flex-1 rounded-xl border border-white/10 bg-white/5 py-3 px-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors appearance-none cursor-pointer text-center";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/20 shadow-[0_0_60px_rgba(0,212,255,0.15)] animate-in fade-in zoom-in-95 duration-300"
           style={{ background: 'linear-gradient(145deg, rgba(10,14,26,0.98) 0%, rgba(13,17,34,0.98) 100%)' }}>
        
        {/* Cosmic glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full" />

        {/* Header */}
        <div className="px-6 pt-10 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
            <Rocket className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
            {t("onboarding.title")}
          </h2>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            {t("onboarding.subtitle")}
          </p>
        </div>

        {/* Date Selector */}
        <div className="px-6 pb-6">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3 mb-6">
            {/* Day */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-400 text-center">{t("onboarding.day")}</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className={selectClass}
              >
                <option value="" className="bg-[#0d1117] text-gray-500">--</option>
                {days.map((d) => (
                  <option key={d} value={d} className="bg-[#0d1117]">{d}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-400 text-center">{t("onboarding.month")}</label>
              <select
                value={month}
                onChange={(e) => { setMonth(e.target.value); if (Number(day) > getMaxDays()) setDay(""); }}
                className={selectClass}
              >
                <option value="" className="bg-[#0d1117] text-gray-500">--</option>
                {months.map((m) => (
                  <option key={m} value={m} className="bg-[#0d1117]">{m}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-400 text-center">{t("onboarding.year")}</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={selectClass}
              >
                <option value="" className="bg-[#0d1117] text-gray-500">--</option>
                {years.map((y) => (
                  <option key={y} value={y} className="bg-[#0d1117]">{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !day || !month || !year}
            className="flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: 'white',
            }}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("onboarding.submit")}
          </button>

          {/* Skip link */}
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-400 transition-colors disabled:opacity-50"
          >
            {t("onboarding.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
