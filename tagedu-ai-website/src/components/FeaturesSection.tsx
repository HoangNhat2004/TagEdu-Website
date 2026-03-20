import { Lightbulb, Bug, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function FeaturesSection() {
  const features = [
    {
      title: "Gợi ý tư duy giải quyết",
      description: "Thay vì đưa ra đoạn code hoàn chỉnh, AI sẽ đặt câu hỏi gợi mở, hướng dẫn bạn từng bước tự tìm ra giải pháp tối ưu.",
      icon: <Lightbulb className="h-10 w-10 text-yellow-500 mb-4" />
    },
    {
      title: "Phân tích & Tìm lỗi (Debug)",
      description: "Dán đoạn code lỗi của bạn vào, hệ thống sẽ chỉ ra nguyên nhân và giải thích cặn kẽ tại sao lại xảy ra lỗi đó.",
      icon: <Bug className="h-10 w-10 text-red-500 mb-4" />
    },
    {
      title: "Theo dõi tiến độ học tập",
      description: "Hệ thống lưu lại lịch sử các phiên hỏi đáp, giúp bạn ôn tập lại kiến thức và theo dõi sự tiến bộ của bản thân.",
      icon: <LineChart className="h-10 w-10 text-green-500 mb-4" />
    }
  ];

  return (
    <section id="features" className="w-full py-20 bg-background">
      <div className="container px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Tính năng nổi bật</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Mọi công cụ bạn cần để nâng cao kỹ năng lập trình và phát triển tư duy logic.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                {feature.icon}
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}