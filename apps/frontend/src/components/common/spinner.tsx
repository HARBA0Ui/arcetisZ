import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("arcetis-spinner relative inline-flex h-4 w-4 shrink-0 items-center justify-center", className)}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full border-2 border-current opacity-20" />
      <span className="arcetis-spinner-ring absolute inset-0 rounded-full border-2 border-b-transparent border-r-transparent border-current" />
    </span>
  );
}
