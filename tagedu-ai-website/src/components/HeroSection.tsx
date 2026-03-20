import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const HERO_BG_URL =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920&q=80";

export function HeroSection() {
  return (
    <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">

      {/* ── LỚP 1: Ảnh nền code editor ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG_URL})` }}
        aria-hidden="true"
      />

      {/* ── LỚP 2: Overlay tối hơn để text trắng dễ đọc ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,20,50,0.72) 0%, rgba(15,30,70,0.68) 50%, rgba(10,20,50,0.72) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── LỚP 3: Nội dung ── */}
      <div className="relative z-10 container px-4 md:px-8 flex flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-balance mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-white">
          <span>Học Code Chủ Động Cùng</span>
          <span className="text-blue-400">TagEdu</span>
        </h1>

        <p className="max-w-[42rem] leading-normal text-blue-100/80 sm:text-xl sm:leading-8 mb-8 text-balance">
          Nền tảng giáo dục thông minh giúp bạn giải quyết các bài toán lập
          trình bằng cách định hướng tư duy, không giải hộ.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Button size="lg" className="w-full sm:w-auto text-base bg-blue-500 hover:bg-blue-400 text-white border-0" asChild>
            <a href="#challenges">
              Làm thử thách ngay <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}