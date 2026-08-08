import { Construction } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  title,
  description,
  module,
}: {
  title: string;
  description: string;
  module: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <Card className="max-w-xl">
        <CardHeader className="items-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Construction className="size-6" />
          </div>
          <Badge variant="muted" className="mb-2">{module}</Badge>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
