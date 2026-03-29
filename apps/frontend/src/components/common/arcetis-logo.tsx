import Image from "next/image";
import { cn } from "@/lib/utils";

export function ArcetisLogo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/logo_light.png"
        alt="arcetis logo light"
        width={600}
        height={150}
        priority
        className={cn("h-16 w-auto object-contain dark:hidden md:h-20", className)}
      />
      <Image
        src="/logo_dark.png"
        alt="arcetis logo dark"
        width={600}
        height={150}
        priority
        className={cn("hidden h-16 w-auto object-contain dark:block md:h-20", className)}
      />
    </>
  );
}
