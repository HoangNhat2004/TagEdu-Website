import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

// Link ảnh động GIF chiếc Mũ cử nhân
const EDU_ANIMATION_URL = "https://fonts.gstatic.com/s/e/notoemoji/latest/1f393/512.gif";

export function HeroSection() {
  return (
    <section className="w-full py-24 md:py-32 lg:py-40 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 md:px-8 flex flex-col items-center text-center">
        
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-balance mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span>Học Code Chủ Động Cùng</span>
          
          {/* [QUAN TRỌNG] Thêm class 'isolate' để nhốt cái ảnh lại, không cho nó chui ra sau nền trắng */}
          <span className="relative inline-flex items-center justify-center isolate px-2">
            
            {/* Ảnh động cái mũ lùi ra sau (z: -1) nhưng vẫn nằm trong vùng isolate */}
            <img
              src={EDU_ANIMATION_URL}
              alt="Graduation Cap"
              className="absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-80 pointer-events-none"
              style={{
                zIndex: -1, 
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-10deg)' // Căn giữa và nghiêng mũ 10 độ cho phong cách
              }}
            />
            
            {/* Chữ TagEdu nổi lên trên */}
            <span className="text-primary relative z-10 drop-shadow-sm">
              TagEdu
            </span>
            
          </span>
        </h1>

        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-8 text-balance">
          Nền tảng giáo dục thông minh giúp bạn giải quyết các bài toán lập trình bằng cách định hướng tư duy, không giải hộ.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Button size="lg" className="w-full sm:w-auto text-base" asChild>
            <a href="#challenges">
              Làm thử thách ngay <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}