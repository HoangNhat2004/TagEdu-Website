import { GripVertical, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardProps {
  onNavigate: (view: "challenge1" | "challenge2") => void;
}

const modules = [
  {
    id: "challenge1" as const,
    title: "Thử thách 1: Phân loại phần mềm",
    description: "Kéo thả phần mềm vào đúng loại của nó.",
    icon: GripVertical,
  },
  {
    id: "challenge2" as const,
    title: "Thử thách 2: Chức năng phần mềm",
    description: "Chọn phần mềm phù hợp với chức năng được yêu cầu.",
    icon: MousePointerClick,
  },
];

const Dashboard = ({ onNavigate }: DashboardProps) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Learn with TagEdu — Bài tập
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chào mừng bạn đến với TagEdu! Chọn một thử thách để bắt đầu luyện tập.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {modules.map((mod) => (
          <Card
            key={mod.id}
            className="group cursor-pointer border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => onNavigate(mod.id)}
          >
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <mod.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{mod.title}</CardTitle>
              <CardDescription>{mod.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Bắt đầu</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
