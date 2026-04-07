import { Compass, Shield, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function FeaturesSection() {
  const { t } = useI18n();

  const features = [
    {
      titleKey: "feature1.title",
      descKey: "feature1.desc",
      icon: <Compass className="h-8 w-8 text-cyan-400" />,
      gradient: "from-cyan-500/20 to-blue-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      titleKey: "feature2.title",
      descKey: "feature2.desc",
      icon: <Shield className="h-8 w-8 text-purple-400" />,
      gradient: "from-purple-500/20 to-pink-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      titleKey: "feature3.title",
      descKey: "feature3.desc",
      icon: <Zap className="h-8 w-8 text-amber-400" />,
      gradient: "from-amber-500/20 to-orange-500/10",
      borderColor: "border-amber-500/20",
    },
  ];

  return (
    <section id="features" className="w-full py-20 relative cosmic-bg">
      <div className="container px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-white"
            style={{ fontFamily: "Outfit, Inter, sans-serif" }}
          >
            {t("features.title")}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`glass-card p-6 rounded-2xl border ${feature.borderColor} group hover:-translate-y-2 transition-all duration-300 hover:shadow-lg`}
            >
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
              >
                {feature.icon}
              </div>
              <h3
                className="text-lg font-bold text-white mb-3"
                style={{ fontFamily: "Outfit, Inter, sans-serif" }}
              >
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}