import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function SectionHeader({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? (
        <div className="flex items-center gap-2">{right}</div>
      ) : (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Arcetis Backoffice</Badge>
        </div>
      )}
    </div>
  );
}
