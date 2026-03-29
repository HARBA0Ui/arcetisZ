import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-2xl font-semibold">{value}</p>
          </div>
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/40">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : null}
        </div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton({ hint = false, icon = false }: { hint?: boolean; icon?: boolean }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
          {icon ? <Skeleton className="h-10 w-10 rounded-full" /> : null}
        </div>
        {hint ? <Skeleton className="mt-2 h-3 w-32" /> : null}
      </CardContent>
    </Card>
  );
}
