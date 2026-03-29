"use client";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  total: number;
  itemLabel: string;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  total,
  itemLabel,
  onPrevious,
  onNext
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/55 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {formatNumber(total)} {itemLabel}
        {total === 1 ? "" : "s"} total
      </p>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={onPrevious}>
          Previous
        </Button>
        <span className="min-w-[5.5rem] text-center text-sm text-muted-foreground">
          Page {page} / {Math.max(totalPages, 1)}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
