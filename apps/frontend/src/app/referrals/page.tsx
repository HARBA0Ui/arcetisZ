"use client";

import { FormEvent, useState } from "react";
import { Copy, Gift, Info, Share2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Spinner } from "@/components/common/spinner";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useReferralStats, useUseReferral } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";

const defaultRules = {
  maxReferralsPerDay: 10,
  referralRewardLevel: 2,
  referralPointsReward: 200,
  referralXpReward: 100
};

export default function ReferralsPage() {
  const stats = useReferralStats();
  const useReferral = useUseReferral();
  const [referralCode, setReferralCode] = useState("");
  const toast = useToast();
  const showSyncBanner = useSmoothBusy(!!stats.data && stats.isFetching);
  const isStatsBootstrapping = stats.isLoading && !stats.data;
  const rules = stats.data?.rules ?? defaultRules;

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      await useReferral.mutateAsync(referralCode);
      toast.success("Referral applied", "Code accepted successfully");
      setReferralCode("");
    } catch (error) {
      toast.error("Referral failed", getApiError(error));
    }
  };

  async function handleCopyCode() {
    if (!stats.data?.referralCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(stats.data.referralCode);
      toast.success("Code copied", "You can share it right away.");
    } catch (error) {
      toast.error("Copy failed", getApiError(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Referrals"
        subtitle="Share your code, track what is pending, and unlock rewards when invited users reach the target level."
        right={<Badge variant="outline">Max {formatNumber(rules.maxReferralsPerDay)}/day</Badge>}
      />

      {showSyncBanner ? <SyncBanner className="mb-6" message="Refreshing referrals..." /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        {stats.data ? (
          <>
            <StatCard label="Your code" value={stats.data.referralCode} icon={Copy} hint="Share this with new members." />
            <StatCard label="Total referrals" value={`${stats.data.total}`} icon={Share2} hint="Every linked signup tied to your code." />
            <StatCard label="Rewarded" value={`${stats.data.rewarded}`} icon={Gift} hint="These already reached the reward level." />
            <StatCard label="Pending" value={`${stats.data.pending}`} icon={Info} hint="These are still climbing toward the trigger." />
          </>
        ) : isStatsBootstrapping ? (
          <>
            <StatCardSkeleton hint icon />
            <StatCardSkeleton hint icon />
            <StatCardSkeleton hint icon />
            <StatCardSkeleton hint icon />
          </>
        ) : (
          <Card className="md:col-span-4 rounded-[1.5rem] border-border/70 bg-card/92 shadow-sm">
            <CardContent className="p-5 text-sm text-muted-foreground">
              Referral stats are not available right now.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="overflow-hidden rounded-[1.8rem] border-[rgba(255,122,24,0.18)] bg-[linear-gradient(135deg,_rgba(18,18,18,0.96),_rgba(34,22,11,0.96)_58%,_rgba(73,33,10,0.92))] text-white shadow-[0_24px_70px_-52px_rgba(255,122,24,0.42)]">
          <CardHeader className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <CardTitle className="text-2xl tracking-tight text-white">How referral codes work</CardTitle>
              <CardDescription className="mt-2 max-w-xl text-white/72">
                Share your code with a new member and let them use it once during sign-up or later from this page.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              disabled={!stats.data?.referralCode}
              className="border-white/14 bg-white/8 text-white hover:bg-white/12 hover:text-white"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>
          </CardHeader>

          <CardContent className="space-y-5 p-6 pt-0">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/18">
                  <Share2 className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                </div>
                <p className="mt-4 text-sm font-semibold text-white">1. Share your code</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Send it to a new member before they lock in another referral code.
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/18">
                  <UserPlus className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                </div>
                <p className="mt-4 text-sm font-semibold text-white">2. They use it once</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  They can enter it during registration or later from this page as long as they have not used another code yet.
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/18">
                  <Gift className="h-4 w-4 text-[hsl(var(--arcetis-ember))]" />
                </div>
                <p className="mt-4 text-sm font-semibold text-white">3. You get rewarded</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  When they reach Level {formatNumber(rules.referralRewardLevel)}, your referral reward is credited automatically.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.1rem] border border-white/10 bg-black/18 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/58">Your reward</p>
                <p className="mt-3 text-xl font-semibold text-white">+{formatNumber(rules.referralPointsReward)} pts</p>
                <p className="mt-1 text-sm text-white/72">+{formatNumber(rules.referralXpReward)} XP</p>
              </div>

              <div className="rounded-[1.1rem] border border-white/10 bg-black/18 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/58">Trigger level</p>
                <p className="mt-3 text-xl font-semibold text-white">Level {formatNumber(rules.referralRewardLevel)}</p>
                <p className="mt-1 text-sm text-white/72">The reward goes to the member who shared the code.</p>
              </div>

              <div className="rounded-[1.1rem] border border-white/10 bg-black/18 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/58">Daily cap</p>
                <p className="mt-3 text-xl font-semibold text-white">{formatNumber(rules.maxReferralsPerDay)} / day</p>
                <p className="mt-1 text-sm text-white/72">A referrer cannot lock in more than this in one day.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.1rem] border border-white/10 bg-white/7 p-4">
                <p className="text-sm font-semibold text-white">Why use a code?</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  It links the new account to the member who invited them so the referral is tracked correctly.
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-white/10 bg-white/7 p-4">
                <p className="text-sm font-semibold text-white">Quick rules</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  One code per account, no self-referrals, and the code can be used during registration or later from this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Use a referral code</CardTitle>
            <CardDescription>
              Paste a code you got from another member. You can only do this once per account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="code">Referral code</Label>
                <Input
                  id="code"
                  value={referralCode}
                  onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                  placeholder="ARCDEMO"
                  required
                />
              </div>

              <Button className="w-full" disabled={useReferral.isPending}>
                {useReferral.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Applying...
                  </span>
                ) : (
                  "Apply code"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
