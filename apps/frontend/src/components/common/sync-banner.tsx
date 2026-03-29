import { Spinner } from "@/components/common/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SyncBanner({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-border/70 bg-card/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70",
        className
      )}
    >
      <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner className="text-foreground/75" />
        <span aria-live="polite">{message}</span>
      </CardContent>
    </Card>
  );
}
