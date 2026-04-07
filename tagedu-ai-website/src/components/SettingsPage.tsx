import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SettingsPage() {
  const { t, language, setLanguage } = useI18n();

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
        </div>
      </div>
    </div>
  );
}
