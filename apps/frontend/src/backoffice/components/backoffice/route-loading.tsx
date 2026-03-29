import { Skeleton } from "@/components/ui/skeleton";

export function BackofficeRouteLoading({ label }: { label: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-4 h-4 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <Skeleton className="h-6 w-40" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <Skeleton className="h-6 w-36" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="mt-5 h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
