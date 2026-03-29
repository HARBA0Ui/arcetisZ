import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoLoader({
  message = "Loading arcetis...",
  compact = false
}: {
  message?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex min-h-[50vh] items-center justify-center", compact ? "min-h-0" : "")}>
      <div className="arcetis-loader-shell relative overflow-hidden rounded-xl border border-border bg-card/85 px-6 py-6 shadow-arcetis">
        <div className="arcetis-loader-sweep" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="arcetis-loader-logo">
            <Image
              src="/logo_light_svg.svg"
              alt="arcetis logo light"
              width={220}
              height={56}
              priority
              className="h-12 w-auto object-contain dark:hidden"
            />
            <Image
              src="/logo_dark_svg.svg"
              alt="arcetis logo dark"
              width={220}
              height={56}
              priority
              className="hidden h-12 w-auto object-contain dark:block"
            />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
