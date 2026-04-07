import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-white/5 py-8" style={{ background: 'rgba(10, 14, 26, 0.9)' }}>
      <div className="container px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gradient-cyan" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
            TagEdu
          </span>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} TagEdu. {t("footer.rights")}
          </p>
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <a href="#" className="hover:text-cyan-400 transition-colors">{t("footer.terms")}</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">{t("footer.privacy")}</a>
        </div>
      </div>
    </footer>
  );
}