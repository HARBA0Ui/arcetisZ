"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Coins, CreditCard, Info, ShieldCheck, Star, Target, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { useLanguage } from "@/components/i18n/language-provider";
import { RewardThumbnail } from "@/components/rewards/reward-thumbnail";
import { RedemptionConfirmModal } from "@/components/rewards/redemption-confirm-modal";
import { Spinner } from "@/components/common/spinner";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useNavigationProgress } from "@/components/navigation/navigation-provider";
import { useRedeemReward, useRewardById, useUserStats } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { getRewardDeliveryFields, getRewardPlans, getSelectedRewardPlan } from "@/lib/reward-options";
import { getAccountAgeDays } from "@/lib/rewards";

const INSTAGRAM_URL = "https://www.instagram.com/arcetis_shop/";

function getDeliveryInputType(type?: string) {
  switch (type) {
    case "EMAIL":
      return "email";
    case "LINK":
      return "url";
    case "SECRET":
      return "password";
    default:
      return "text";
  }
}

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const rewardId = params?.id ?? "";

  const rewardQuery = useRewardById(rewardId);
  const stats = useUserStats();
  const redeem = useRedeemReward();
  const toast = useToast();
  const { language, t } = useLanguage();
  const detailCopy = useMemo(
    () =>
      language === "ar"
        ? {
            refreshing: "جارٍ تحديث تفاصيل المنتج...",
            standardPlan: "الخطة الأساسية",
            enterField: (label: string) => `أدخل ${label}`,
            closeDtModal: "إغلاق نافذة شراء المنتج بالدينار",
            buyWithDt: "شراء بالدينار",
            completeThroughInstagram: "أكمل هذا الشراء عبر إنستغرام",
            dtDescription:
              "لطلبات الدينار، أرسل لنا رسالة على إنستغرام مع اسم المنتج والخطة المختارة والمعلومات التي جهزتها مسبقًا.",
            price: "السعر",
            notFilledYet: "لم يتم ملؤها بعد",
            messageOnInstagram: "راسلنا على إنستغرام",
            cancel: "إلغاء"
          }
        : {
            refreshing: "Refreshing reward details...",
            standardPlan: "Standard",
            enterField: (label: string) => `Enter ${label.toLowerCase()}`,
            closeDtModal: "Close TND purchase modal",
            buyWithDt: "Buy with DT",
            completeThroughInstagram: "Complete this purchase through Instagram",
            dtDescription:
              "For DT orders, send us a message on Instagram with the product name, selected plan, and the info you already prepared.",
            price: "Price",
            notFilledYet: "Not filled yet",
            messageOnInstagram: "Message us on Instagram",
            cancel: "Cancel"
          },
    [language]
  );

  const reward = rewardQuery.data;
  const hasRewardData = !!reward || !!stats.data;
  const showSyncBanner = useSmoothBusy(hasRewardData && (rewardQuery.isFetching || stats.isFetching));
  const points = stats.data?.user.points ?? 0;
  const level = stats.data?.user.level ?? 1;
  const accountAgeDays = getAccountAgeDays(stats.data?.user.createdAt);

  const planOptions = useMemo(() => (reward ? getRewardPlans(reward) : []), [reward]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState<Record<string, string>>({});
  const [isTndModalOpen, setTndModalOpen] = useState(false);
  const [isRedeemConfirmOpen, setRedeemConfirmOpen] = useState(false);

  useEffect(() => {
    if (!reward) {
      return;
    }

    const selected = getSelectedRewardPlan(reward, selectedPlanId);
    if (selected && selected.id !== selectedPlanId) {
      setSelectedPlanId(selected.id);
    }
  }, [reward, selectedPlanId]);

  useEffect(() => {
    if (!isTndModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isTndModalOpen]);

  const selectedPlan = reward ? getSelectedRewardPlan(reward, selectedPlanId) : null;
  const deliveryFields = reward ? getRewardDeliveryFields(reward) : [];
  const hasSensitiveDeliveryField = deliveryFields.some(
    (field) => field.type === "SECRET" || field.retention === "until_processed"
  );
  const remainingPoints = selectedPlan ? Math.max(selectedPlan.pointsCost - points, 0) : 0;
  const missingRequiredInfo = deliveryFields.some(
    (field) => (field.required ?? true) && !deliveryInfo[field.id]?.trim()
  );
  const canRedeem =
    !!reward &&
    !!selectedPlan &&
    reward.stock > 0 &&
    points >= selectedPlan.pointsCost &&
    level >= reward.minLevel &&
    accountAgeDays >= reward.minAccountAge &&
    !missingRequiredInfo;
  const summaryFacts = reward
    ? [
        {
          id: "level-required",
          label: t("level"),
          value: `${reward.minLevel}+`,
          icon: Star,
          iconClassName: "text-amber-300"
        },
        {
          id: "points-remaining",
          label: t("remaining"),
          value: stats.data && selectedPlan ? `${formatNumber(remainingPoints)} pts` : "...",
          icon: Target,
          iconClassName: remainingPoints > 0 ? "text-[hsl(var(--arcetis-ember))]" : "text-emerald-300"
        }
      ]
    : [];

  return (
    <>
      <PageHeader
        title={reward?.title ?? t("rewardDetailsFallback")}
        subtitle={t("rewardDetailsSubtitle")}
        right={
          <Button asChild variant="outline" size="sm">
            <Link href="/rewards">{t("backToProducts")}</Link>
          </Button>
        }
      />

      {showSyncBanner ? <SyncBanner message={detailCopy.refreshing} /> : null}

      {reward ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95">
              <CardContent className="p-5 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                  <div className="w-full max-w-[220px] shrink-0">
                    <RewardThumbnail
                      title={reward.title}
                      imageUrl={reward.imageUrl}
                      className="aspect-square w-full rounded-[1.35rem] border-border/60 shadow-[0_24px_54px_-36px_rgba(0,0,0,0.72)]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-3xl font-semibold tracking-tight">{reward.title}</h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{reward.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reward.stock <= 0 ? <Badge variant="outline">{t("outOfStock")}</Badge> : null}
                        {planOptions.length > 1 ? <Badge variant="outline">{planOptions.length} {t("plans").toLowerCase()}</Badge> : null}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Badge variant="outline">{t("minimumLevel", { level: reward.minLevel })}</Badge>
                      <Badge variant="outline">{t("accountAgeDays", { days: reward.minAccountAge })}</Badge>
                      {deliveryFields.length ? (
                        <Badge variant="outline">{t("infoFields", { count: deliveryFields.length })}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                {planOptions.length > 1 ? (
                  <div className="mt-8 space-y-3 border-t border-border/70 pt-6">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{t("choosePlan")}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {planOptions.map((plan) => {
                        const isActive = selectedPlan?.id === plan.id;

                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              isActive
                                ? "border-[hsl(var(--arcetis-ember))] bg-[rgba(255,122,24,0.08)] shadow-[0_18px_48px_-38px_rgba(255,122,24,0.48)]"
                                : "border-border/70 bg-background/72 hover:border-border hover:bg-background"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">{plan.label}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatNumber(plan.pointsCost)} {t("menuPoints").toLowerCase()}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={isActive ? "default" : "outline"}>
                                  {formatNumber(plan.pointsCost)} pts
                                </Badge>
                                {typeof plan.tndPrice === "number" ? (
                                  <Badge variant="outline">{formatNumber(plan.tndPrice, { maximumFractionDigits: 2 })} DT</Badge>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {deliveryFields.length ? (
                  <div className="mt-8 space-y-4 border-t border-border/70 pt-6">
                    <div>
                      <p className="font-medium">{t("informationNeeded")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("fillExactInfo")}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {deliveryFields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={`reward-field-${field.id}`}>
                            {field.label}
                            {field.required ?? true ? " *" : ""}
                          </Label>
                          <Input
                            id={`reward-field-${field.id}`}
                            type={getDeliveryInputType(field.type)}
                            value={deliveryInfo[field.id] ?? ""}
                            placeholder={field.placeholder ?? detailCopy.enterField(field.label)}
                            autoComplete={field.type === "SECRET" ? "off" : undefined}
                            onChange={(event) =>
                              setDeliveryInfo((prev) => ({
                                ...prev,
                                [field.id]: event.target.value
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 border-t border-border/70 pt-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{t("description")}</p>
                  <div className="mt-4 rounded-2xl border border-border/70 bg-background/72 p-5 text-sm leading-7 text-muted-foreground">
                    {reward.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 xl:sticky xl:top-24">
            <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95">
              <CardHeader className="items-center space-y-2 pb-3 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div>
                    <CardTitle className="flex items-center justify-center gap-2 text-[1.8rem] leading-none tabular-nums">
                      <Coins className="h-5 w-5 text-[hsl(var(--arcetis-ember))]" />
                      {selectedPlan ? `${formatNumber(selectedPlan.pointsCost)} pts` : "-"}
                    </CardTitle>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {planOptions.length > 1 ? (
                      <Badge variant="outline" className="px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {selectedPlan?.label ?? detailCopy.standardPlan}
                      </Badge>
                    ) : null}
                    {reward.stock <= 0 ? <Badge variant="outline" className="px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em]">{t("outOfStock")}</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 border-y border-border/60 py-4">
                  {summaryFacts.map((fact) => {
                    const Icon = fact.icon;

                    return (
                      <div
                        key={fact.id}
                        title={fact.label}
                        aria-label={`${fact.label}: ${fact.value}`}
                        className="flex flex-col items-center text-center"
                      >
                        <Icon className={`h-4 w-4 ${fact.iconClassName}`} />
                        <p className="mt-2 text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                          {fact.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-5 tracking-tight tabular-nums">
                          {fact.value}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-3">
                  <Button
                    className="h-12 w-full"
                    disabled={!canRedeem || redeem.isPending}
                    onClick={() => setRedeemConfirmOpen(true)}
                  >
                    {redeem.isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner /> {t("processing")}
                      </span>
                    ) : reward.stock <= 0 ? (
                      <span className="inline-flex items-center gap-2">
                        <X className="h-4 w-4" />
                        {t("outOfStock")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        {t("getProduct")}
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full"
                    disabled={typeof selectedPlan?.tndPrice !== "number"}
                    onClick={() => setTndModalOpen(true)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {typeof selectedPlan?.tndPrice === "number"
                        ? `${formatNumber(selectedPlan.tndPrice, { maximumFractionDigits: 2 })} DT`
                        : t("unavailableDt")}
                    </span>
                  </Button>
                </div>

                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--arcetis-ember))]" />
                  <p>
                    {t("makeSureInfoMatches")}
                  </p>
                </div>

                {deliveryFields.length ? (
                  <div className="text-sm">
                    <p className="font-medium">{t("deliveryInputs")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {deliveryFields.map((field) => (
                        <Badge key={field.id} variant="outline">
                          {field.label}
                        </Badge>
                      ))}
                    </div>
                    {hasSensitiveDeliveryField ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t("sensitiveInfoStored")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : rewardQuery.isLoading ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      ) : null}

      {rewardQuery.isFetched && !reward ? (
        <Card className="max-w-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">{t("productsUnavailable")}</CardContent>
        </Card>
      ) : null}

      {reward && selectedPlan ? (
        <RedemptionConfirmModal
          open={isRedeemConfirmOpen}
          rewardTitle={reward.title}
          planLabel={selectedPlan.label}
          pointsCost={selectedPlan.pointsCost}
          isPending={redeem.isPending}
          onClose={() => setRedeemConfirmOpen(false)}
          onConfirm={async () => {
            try {
              const created = await redeem.mutateAsync({
                rewardId: reward.id,
                planId: selectedPlan.id,
                requestedInfo: deliveryInfo
              });

              setRedeemConfirmOpen(false);
              const nextPath = `/requests/${created.id}`;
              toast.success(t("requestCreated"), t("requestPageReady"));
              startNavigation(nextPath);
              router.push(nextPath);
            } catch (error) {
              toast.error(t("requestFailed"), getApiError(error));
            }
          }}
        />
      ) : null}

      {isTndModalOpen && reward && selectedPlan ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label={detailCopy.closeDtModal}
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            onClick={() => setTndModalOpen(false)}
          />
          <div className="relative z-[91] w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-background shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,120,40,0.18),transparent_34%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%)]" />
            <div className="relative p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">{detailCopy.buyWithDt}</Badge>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">{detailCopy.completeThroughInstagram}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {detailCopy.dtDescription}
                  </p>
                </div>
                <Button type="button" variant="outline" className="h-10 w-10 rounded-full p-0" onClick={() => setTndModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                <p className="font-medium">{reward.title}</p>
                <p className="mt-1 text-muted-foreground">{t("plan")}: {selectedPlan.label}</p>
                <p className="mt-1 text-muted-foreground">
                  {detailCopy.price}: {typeof selectedPlan.tndPrice === "number" ? formatNumber(selectedPlan.tndPrice, { maximumFractionDigits: 2 }) : "-"} DT
                </p>
                {deliveryFields.length ? (
                  <div className="mt-3 space-y-1 text-muted-foreground">
                    {deliveryFields.map((field) => (
                      <p key={field.id}>
                        {field.label}: {deliveryInfo[field.id]?.trim() || detailCopy.notFilledYet}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-[hsl(var(--arcetis-ember))] text-black hover:bg-[rgba(255,122,24,0.92)]">
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                    {detailCopy.messageOnInstagram}
                  </a>
                </Button>
                <Button type="button" variant="outline" onClick={() => setTndModalOpen(false)}>
                  {detailCopy.cancel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


