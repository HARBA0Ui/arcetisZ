"use client";

import { useEffect } from "react";
import { AlertTriangle, Coins, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

export function RedemptionConfirmModal({
  open,
  rewardTitle,
  pointsCost,
  planLabel,
  isPending,
  onClose,
  onConfirm
}: {
  open: boolean;
  rewardTitle: string;
  pointsCost: number;
  planLabel?: string | null;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close redemption confirmation"
        className="absolute inset-0 bg-black/72 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[91] w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-background shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,120,40,0.18),transparent_34%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="relative p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t("confirmRequest")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{t("spendPointsForProduct")}</h2>
            </div>
            <Button type="button" variant="outline" className="h-10 w-10 rounded-full p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/72 p-5">
            <p className="font-medium">{rewardTitle}</p>
            {planLabel ? <p className="mt-1 text-sm text-muted-foreground">{t("plan")}: {planLabel}</p> : null}
            <div className="mt-4 flex items-center gap-2 text-lg font-semibold">
              <Coins className="h-5 w-5 text-[hsl(var(--arcetis-ember))]" />
              <span>{formatNumber(pointsCost)} pts</span>
            </div>
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-[rgba(255,122,24,0.25)] bg-[rgba(255,122,24,0.08)] p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--arcetis-ember))]" />
              <p className="leading-6 text-foreground">
                {t("confirmSpendWarning")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t("noCancel")}
            </Button>
            <Button type="button" onClick={() => void onConfirm()} disabled={isPending}>
              {isPending ? t("processing") : t("yesContinue")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
