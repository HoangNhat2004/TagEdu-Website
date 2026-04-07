import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="relative w-full py-16 md:py-24 lg:py-32 cosmic-bg overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-16">
          
          {/* Left side: Title & Subtitle */}
          <div className="flex-1 max-w-2xl">
            <h1 className="mb-6" style={{ fontFamily: 'Outfit, Inter, sans-serif', overflow: 'visible' }}>
              <span
                className="block text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white"
                style={{ lineHeight: 1.3 }}
              >
                {t("hero.title1")}
              </span>
              <span
                className="block text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gradient-cyan pt-3"
                style={{ lineHeight: 1.4, paddingBottom: '4px' }}
              >
                {t("hero.title2")}
              </span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-lg leading-relaxed">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Right side: Mascot + Speech bubble */}
          <div className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {/* Mascot avatar */}
            <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10 animate-float">
              <img
                src="/mascot.png"
                alt="Space Turtle Mascot"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Speech bubble */}
            <div className="glass-card px-5 py-4 max-w-xs md:max-w-sm relative">
              <div className="absolute left-0 top-5 -translate-x-2 w-3 h-3 rotate-45 bg-[rgba(15,23,42,0.6)] border-l border-b border-cyan-500/10" />
              <p className="text-sm text-gray-300 leading-relaxed">
                "{t("hero.mascotMsg")}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}