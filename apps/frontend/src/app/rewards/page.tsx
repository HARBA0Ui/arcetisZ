"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, Coins, CreditCard, Search, ShieldCheck } from "lucide-react";
import { DeferredSection } from "@/components/common/deferred-section";
import { PageHeader } from "@/components/common/page-header";
import { useLanguage } from "@/components/i18n/language-provider";
import { RedemptionConfirmModal } from "@/components/rewards/redemption-confirm-modal";
import { RewardThumbnail } from "@/components/rewards/reward-thumbnail";
import { Spinner } from "@/components/common/spinner";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useRedeemReward, useRewards, useRewardsCatalog, useUserStats } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { getRewardDeliveryFields, getRewardStartingPointsCost, getRewardStartingTndPrice, rewardHasSelectablePlans } from "@/lib/reward-options";
import {
  canUserRedeemReward,
  getNextRewardTarget,
  getRewardTargetStatusLabel,
  getRewardTargetSummary
} from "@/lib/rewards";
import { cn } from "@/lib/utils";

const REWARDS_PAGE_SIZE = 9;

export default function RewardsPage() {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const rewards = useRewards();
  const stats = useUserStats();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const rewardsCatalog = useRewardsCatalog({
    q: deferredSearch || undefined,
    page,
    pageSize: REWARDS_PAGE_SIZE
  });
  const redeem = useRedeemReward();
  const toast = useToast();
  const { t } = useLanguage();
  const [confirmState, setConfirmState] = useState<{
    rewardId: string;
    rewardTitle: string;
    pointsCost: number;
    planLabel?: string | null;
  } | null>(null);
  const hasRewardData = !!rewards.data || !!stats.data;
  const showSyncBanner = useSmoothBusy(
    hasRewardData && (rewards.isFetching || stats.isFetching || rewardsCatalog.isFetching)
  );
  const activeRewardId = redeem.isPending ? redeem.variables?.rewardId : null;
  const rewardTarget = rewards.data && stats.data ? getNextRewardTarget(rewards.data, stats.data.user) : null;
  const isStatsBootstrapping = stats.isLoading && !stats.data;
  const isRewardsBootstrapping = rewardsCatalog.isLoading && !rewardsCatalog.data;
  const visiblePageNumbers = useMemo(() => {
    const totalPages = rewardsCatalog.data?.totalPages ?? 1;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [page, rewardsCatalog.data?.totalPages]);
  const rewardsGridFallback = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: REWARDS_PAGE_SIZE }).map((_, index) => (
        <Card key={index} className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border-border/70 bg-card/95">
          <Skeleton className="aspect-square w-full rounded-none" />
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (rewardsCatalog.data && rewardsCatalog.data.page !== page) {
      setPage(rewardsCatalog.data.page);
    }
  }, [page, rewardsCatalog.data]);

  return (
    <>
      <PageHeader
        title={t("rewardsTitle")}
        subtitle={t("rewardsSubtitle")}
        right={
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("rewardCooldown")}
          </Badge>
        }
      />

      <div className="mb-4 text-sm text-muted-foreground">
        {t("balance")}:{" "}
        {stats.data ? (
          <span className="font-medium text-foreground">{formatNumber(stats.data.user.points)} {t("menuPoints").toLowerCase()}</span>
        ) : isStatsBootstrapping ? (
          <Skeleton className="mx-1 inline-block h-5 w-24 align-middle" />
        ) : (
          <span className="font-medium text-foreground">Unavailable</span>
        )}{" "}
        | {t("level")}{" "}
        {stats.data ? (
          <span className="font-medium text-foreground">{stats.data.user.level}</span>
        ) : isStatsBootstrapping ? (
          <Skeleton className="ml-1 inline-block h-5 w-10 align-middle" />
        ) : (
          <span className="font-medium text-foreground">-</span>
        )}
      </div>

      {showSyncBanner ? <SyncBanner className="mb-4" message="Refreshing rewards..." /> : null}

      {rewards.data && stats.data ? (
        rewardTarget ? (
          <Card className="mb-6 overflow-hidden rounded-[2rem] border-[rgba(255,122,24,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(255,247,241,0.96))] shadow-[0_24px_70px_-52px_rgba(255,122,24,0.38)] dark:bg-[linear-gradient(180deg,_rgba(18,18,18,0.96),_rgba(10,10,10,0.98))]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-5">
                <div className="mx-auto w-full max-w-[176px] shrink-0 sm:mx-0">
                  <RewardThumbnail title={rewardTarget.reward.title} imageUrl={rewardTarget.reward.imageUrl} className="aspect-square w-full" />
                </div>

                <div className="min-w-0 flex-1 basis-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[hsl(var(--arcetis-ember))]">{t("nextAffordableProduct")}</Badge>
                    <Badge variant="outline" className="border-[rgba(255,122,24,0.22)] bg-[rgba(255,122,24,0.06)]">{getRewardTargetStatusLabel(rewardTarget)}</Badge>
                  </div>

                  <p className="mt-4 text-2xl font-semibold tracking-tight" title={rewardTarget.reward.title}>{rewardTarget.reward.title}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{getRewardTargetSummary(rewardTarget)}</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1rem] border border-border/60 bg-background/78 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("from")}</p>
                        <p className="mt-1 font-semibold">{formatNumber(getRewardStartingPointsCost(rewardTarget.reward))} pts</p>
                      </div>
                      <div className="rounded-[1rem] border border-border/60 bg-background/78 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("balance")}</p>
                      <p className="mt-1 font-semibold">{formatNumber(stats.data.user.points)} pts</p>
                    </div>
                      <div className="rounded-[1rem] border border-border/60 bg-background/78 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("plans")}</p>
                        <p className="mt-1 font-semibold">{rewardTarget.reward.plans?.length ?? 1}</p>
                      </div>
                    </div>
                </div>

                <Button asChild className="w-full justify-between rounded-xl bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[rgba(255,122,24,0.92)] sm:w-auto">
                  <Link href={`/rewards/${rewardTarget.reward.id}`}>
                    {t("viewTarget")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 rounded-[2rem]">
            <CardContent className="p-6 text-sm text-muted-foreground">{t("productsUnavailable")}</CardContent>
          </Card>
        )
      ) : isRewardsBootstrapping || isStatsBootstrapping ? (
        <Card className="mb-6 rounded-[2rem]">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-5">
              <Skeleton className="aspect-square w-full max-w-[176px] rounded-[1.25rem]" />
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 rounded-[2rem]">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Reward highlights are not available right now.
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder={t("searchProducts")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {t("results", { count: rewardsCatalog.data?.total ?? 0 })}
            </Badge>
            <Badge variant="outline">
              {t("pageOf", { page: rewardsCatalog.data?.page ?? page, total: rewardsCatalog.data?.totalPages ?? 1 })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <DeferredSection fallback={rewardsGridFallback}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rewardsCatalog.data
            ? rewardsCatalog.data.items.map((reward) => {
              const canRedeem = canUserRedeemReward(reward, stats.data?.user);
              const isTargetReward = rewardTarget?.reward.id === reward.id;
              const startingCost = getRewardStartingPointsCost(reward);
              const startingTndPrice = getRewardStartingTndPrice(reward);
              const needsDetails = rewardHasSelectablePlans(reward) || getRewardDeliveryFields(reward).length > 0;

              return (
                <Card key={reward.id} className={cn("flex h-full flex-col overflow-hidden rounded-[1.5rem] border-border/70 bg-card/95", isTargetReward && "border-[rgba(255,122,24,0.22)] shadow-[0_22px_70px_-46px_rgba(255,122,24,0.38)]")}>
                  <RewardThumbnail title={reward.title} imageUrl={reward.imageUrl} className="aspect-square w-full rounded-none border-x-0 border-t-0 border-b" />
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      {isTargetReward ? <Badge className="rounded-full bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[hsl(var(--arcetis-ember))]">{t("nextAffordableProduct")}</Badge> : null}
                      {reward.plans?.length ? <Badge variant="outline">{reward.plans.length} {t("plans").toLowerCase()}</Badge> : null}
                    </div>
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col space-y-3 text-sm">
                    <p className="inline-flex items-center gap-2 text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      <span className="text-foreground">{t("startingAtPoints", { points: formatNumber(startingCost) })}</span>
                    </p>
                    <p className="inline-flex items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-foreground">Required Level: {reward.minLevel}</span>
                    </p>
                    <p className="inline-flex items-center gap-2 text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      <span className="text-foreground">Account age lock: {reward.minAccountAge} days</span>
                    </p>
                    {typeof startingTndPrice === "number" ? (
                      <p className="inline-flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-foreground">From {formatNumber(startingTndPrice, { maximumFractionDigits: 2 })} TND</span>
                      </p>
                    ) : null}

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                      <Button variant="outline" asChild>
                        <Link href={`/rewards/${reward.id}`}>{needsDetails ? "Choose plan" : "Details"}</Link>
                      </Button>
                      <Button
                        disabled={needsDetails ? false : !canRedeem || redeem.isPending}
                        onClick={async () => {
                          if (needsDetails) {
                            window.location.href = `/rewards/${reward.id}`;
                            return;
                          }

                          setConfirmState({
                            rewardId: reward.id,
                            rewardTitle: reward.title,
                            pointsCost: startingCost,
                            planLabel: reward.plans?.[0]?.label ?? "Standard"
                          });
                        }}
                      >
                        {redeem.isPending && activeRewardId === reward.id ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner /> Working...
                          </span>
                        ) : needsDetails ? (
                          "Open offer"
                        ) : (
                          "Get product"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
            : isRewardsBootstrapping
              ? Array.from({ length: REWARDS_PAGE_SIZE }).map((_, index) => (
                  <Card key={index} className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border-border/70 bg-card/95">
                    <Skeleton className="aspect-square w-full rounded-none" />
                    <CardHeader>
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      Rewards are not available right now.
                    </CardContent>
                  </Card>
                )}
        </div>
      </DeferredSection>

      {rewardsCatalog.data && !rewardsCatalog.data.items.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {deferredSearch ? "No rewards match your search." : "No rewards available."}
        </p>
      ) : null}

      {rewardsCatalog.data && rewardsCatalog.data.totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {visiblePageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              variant={pageNumber === (rewardsCatalog.data?.page ?? page) ? "default" : "outline"}
              className="min-w-10"
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}

          <Button
            type="button"
            variant="outline"
            disabled={page >= (rewardsCatalog.data?.totalPages ?? 1)}
            onClick={() =>
              setPage((current) => Math.min(rewardsCatalog.data?.totalPages ?? current, current + 1))
            }
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {confirmState ? (
        <RedemptionConfirmModal
          open={!!confirmState}
          rewardTitle={confirmState.rewardTitle}
          planLabel={confirmState.planLabel}
          pointsCost={confirmState.pointsCost}
          isPending={redeem.isPending}
          onClose={() => setConfirmState(null)}
          onConfirm={async () => {
            try {
              const created = await redeem.mutateAsync({ rewardId: confirmState.rewardId });
              setConfirmState(null);
              const nextPath = `/requests/${created.id}`;
              toast.success("Request created", "Your product request page is ready.");
              startNavigation(nextPath);
              router.push(nextPath);
            } catch (error) {
              toast.error("Redemption failed", getApiError(error));
            }
          }}
        />
      ) : null}
    </>
  );
}
