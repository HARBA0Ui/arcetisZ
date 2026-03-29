import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full bg-gradient-to-r from-zinc-100 to-zinc-300 transition-all duration-500", indicatorClassName)}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
