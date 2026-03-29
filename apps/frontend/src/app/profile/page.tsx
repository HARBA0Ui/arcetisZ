"use client";

import { FormEvent, useMemo, useState } from "react";
import { BriefcaseBusiness, Globe2, Megaphone, ShieldCheck, XCircle } from "lucide-react";
import { DeferredSection } from "@/components/common/deferred-section";
import { PageHeader } from "@/components/common/page-header";
import { PromotionRequestForm } from "@/components/sponsor/promotion-request-form";
import { Spinner } from "@/components/common/spinner";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { SyncBanner } from "@/components/common/sync-banner";
import { useToast } from "@/components/common/toast-center";
import { useLanguage, type AppLanguage } from "@/components/i18n/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSmoothBusy } from "@/hooks/use-smooth-busy";
import { useMe, useUpdateSettings } from "@/hooks/useAuth";
import { useSponsorRequests, useUserStats } from "@/hooks/usePlatform";
import { getApiError } from "@/lib/api";
import { normalizeAssetUrl } from "@/lib/assets";
import { isOtherSponsorCategory } from "@/lib/sponsor-requests";
import type { SponsorRequest, SponsorRequestCategory } from "@/lib/types";

const sponsorStatusStyles: Record<SponsorRequest["status"], string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200"
};

function getProfileCopy(language: AppLanguage) {
  if (language === "ar") {
    return {
      title: "الملف الشخصي",
      subtitle: "حسابك الشخصي وملخص ترتيبك الحالي",
      refreshing: "جارٍ تحديث الملف الشخصي...",
      username: "اسم المستخدم",
      email: "البريد الإلكتروني",
      level: "المستوى",
      referralCode: "كود الإحالة",
      pointsLabel: "النقاط",
      xpLabel: "الخبرة",
      profileUnavailable: "معلومات الملف الشخصي غير متاحة الآن.",
      settings: "الإعدادات",
      newEmail: "بريد إلكتروني جديد",
      newUsername: "اسم مستخدم جديد",
      currentPassword: "كلمة المرور الحالية",
      newPassword: "كلمة مرور جديدة",
      confirmNewPassword: "تأكيد كلمة المرور الجديدة",
      currentPasswordPlaceholder: "أدخل كلمة المرور الحالية",
      newPasswordPlaceholder: "اختر كلمة مرور جديدة",
      confirmPasswordPlaceholder: "أعد إدخال كلمة المرور الجديدة",
      passwordMismatch: "كلمتا المرور غير متطابقتين",
      passwordMismatchHint: "يجب أن تتطابق كلمة المرور الجديدة مع التأكيد.",
      noChanges: "لا توجد تغييرات",
      noChangesHint: "حدّث خانة واحدة على الأقل قبل الحفظ.",
      settingsUpdated: "تم تحديث الإعدادات",
      settingsUpdatedHint: "تم حفظ بيانات ملفك الشخصي بنجاح.",
      updateFailed: "تعذر تحديث الإعدادات",
      saveSettings: "حفظ الإعدادات",
      saving: "جارٍ الحفظ...",
      submitPromotionRequest: "أرسل طلب ترويج",
      promotionHistory: "سجل طلبات الترويج",
      noPromotionRequests:
        "لا توجد طلبات ترويج حتى الآن. ابدأ بحملة على وسائل التواصل أو أي فكرة مهمة ممولة.",
      promotionHistoryUnavailable: "سجل طلبات الترويج غير متاح الآن.",
      otherReason: "سبب التصنيف الآخر",
      points: (value: number) => `${value} نقطة`,
      xp: (value: number) => `${value} خبرة`,
      people: (value: number) => `${value} شخص`,
      levelShort: (value: number) => `المستوى ${value}+`,
      reviewNote: "ملاحظة المراجعة",
      published: "تم النشر على المنصة",
      notApproved: "لم تتم الموافقة على الطلب",
      reviseRequest: "حدّث الفكرة ثم أرسل طلبًا جديدًا أو معدلًا.",
      leaderboard: "الترتيب",
      leaderboardUnavailable: "بيانات الترتيب غير متاحة الآن.",
      rank: "#",
      user: "المستخدم",
      accepted: "مقبول",
      pending: "قيد المراجعة",
      rejected: "مرفوض"
    };
  }

  return {
    title: "Profile",
    subtitle: "Your account and leaderboard snapshot",
    refreshing: "Refreshing profile...",
    username: "Username",
    email: "Email",
    level: "Level",
    referralCode: "Referral Code",
    pointsLabel: "Points",
    xpLabel: "XP",
    profileUnavailable: "Profile information is not available right now.",
    settings: "Settings",
    newEmail: "New Email",
    newUsername: "New Username",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    currentPasswordPlaceholder: "Enter your current password",
    newPasswordPlaceholder: "Choose a new password",
    confirmPasswordPlaceholder: "Re-enter the new password",
    passwordMismatch: "Password mismatch",
    passwordMismatchHint: "New password and confirmation must match.",
    noChanges: "No changes",
    noChangesHint: "Update at least one setting before saving.",
    settingsUpdated: "Settings updated",
    settingsUpdatedHint: "Your profile credentials were saved.",
    updateFailed: "Update failed",
    saveSettings: "Save Settings",
    saving: "Saving...",
    submitPromotionRequest: "Submit Promotion Request",
    promotionHistory: "Promotion Request History",
    noPromotionRequests:
      "No promotion requests yet. Start with a social media campaign or another sponsored task idea.",
    promotionHistoryUnavailable: "Promotion request history is not available right now.",
    otherReason: "Other reason",
    points: (value: number) => `${value} pts`,
    xp: (value: number) => `${value} XP`,
    people: (value: number) => `${value} people`,
    levelShort: (value: number) => `Level ${value}+`,
    reviewNote: "Review note",
    published: "Published to the platform",
    notApproved: "Request not approved",
    reviseRequest: "Update the concept and submit a revised request.",
    leaderboard: "Leaderboard",
    leaderboardUnavailable: "Leaderboard data is not available right now.",
    rank: "#",
    user: "User",
    accepted: "Accepted",
    pending: "Pending",
    rejected: "Rejected"
  };
}

function formatStatus(status: SponsorRequest["status"], copy: ReturnType<typeof getProfileCopy>) {
  if (status === "accepted") return copy.accepted;
  if (status === "rejected") return copy.rejected;
  return copy.pending;
}

function formatSponsorCategoryLabel(category: SponsorRequestCategory, language: AppLanguage) {
  const copy =
    language === "ar"
      ? {
          SOCIAL_MEDIA: "وسائل التواصل",
          PRODUCT_PROMOTION: "موقع أو منتج",
          COMMUNITY: "مجتمع",
          EVENT_CAMPAIGN: "حدث",
          CONTENT_CREATOR: "أخرى"
        }
      : {
          SOCIAL_MEDIA: "Social Media",
          PRODUCT_PROMOTION: "Website",
          COMMUNITY: "Community",
          EVENT_CAMPAIGN: "Event",
          CONTENT_CREATOR: "Other"
        };

  return copy[category] ?? category;
}

export default function ProfilePage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getProfileCopy(language), [language]);
  const me = useMe();
  const stats = useUserStats();
  const sponsorRequests = useSponsorRequests();
  const updateSettings = useUpdateSettings();
  const toast = useToast();
  const hasProfileData = !!me.data || !!stats.data;
  const showSyncBanner = useSmoothBusy(
    hasProfileData && (me.isFetching || stats.isFetching || sponsorRequests.isFetching)
  );
  const isMeBootstrapping = me.isLoading && !me.data;
  const rightColumnFallback = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
            {copy.promotionHistory}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border/70 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.leaderboard}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.rank}</TableHead>
                <TableHead>{copy.user}</TableHead>
                <TableHead>{copy.level}</TableHead>
                <TableHead>{copy.pointsLabel}</TableHead>
                <TableHead>{copy.xpLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
  const [form, setForm] = useState({
    email: "",
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const submitSettings = async (event: FormEvent) => {
    event.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error(copy.passwordMismatch, copy.passwordMismatchHint);
      return;
    }

    const payload = {
      email: form.email.trim() || undefined,
      username: form.username.trim() || undefined,
      currentPassword: form.currentPassword || undefined,
      newPassword: form.newPassword || undefined
    };

    if (!payload.email && !payload.username && !payload.newPassword) {
      toast.info(copy.noChanges, copy.noChangesHint);
      return;
    }

    try {
      await updateSettings.mutateAsync(payload);
      toast.success(copy.settingsUpdated, copy.settingsUpdatedHint);
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (error) {
      toast.error(copy.updateFailed, getApiError(error));
    }
  };

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      {showSyncBanner ? <SyncBanner className="mb-6" message={copy.refreshing} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        {me.data ? (
          <>
            <StatCard label={copy.username} value={me.data.username} />
            <StatCard label={copy.email} value={me.data.email} />
            <StatCard label={copy.level} value={String(me.data.level)} />
            <StatCard label={copy.referralCode} value={me.data.referralCode} />
          </>
        ) : isMeBootstrapping ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <Card className="md:col-span-4">
            <CardContent className="p-5 text-sm text-muted-foreground">
              {copy.profileUnavailable}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{copy.settings}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitSettings} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{copy.newEmail}</Label>
              <Input
                type="email"
                placeholder={me.data?.email ?? "you@example.com"}
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{copy.newUsername}</Label>
              <Input
                placeholder={me.data?.username ?? "username"}
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{copy.currentPassword}</Label>
              <Input
                type="password"
                placeholder={copy.currentPasswordPlaceholder}
                value={form.currentPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{copy.newPassword}</Label>
              <Input
                type="password"
                placeholder={copy.newPasswordPlaceholder}
                value={form.newPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{copy.confirmNewPassword}</Label>
              <Input
                type="password"
                placeholder={copy.confirmPasswordPlaceholder}
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
            <Button className="md:col-span-2" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  {copy.saving}
                </span>
              ) : (
                copy.saveSettings
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              {copy.submitPromotionRequest}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PromotionRequestForm submitLabel={copy.submitPromotionRequest} />
          </CardContent>
        </Card>

        <DeferredSection fallback={rightColumnFallback} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
                {copy.promotionHistory}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sponsorRequests.isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-border/70 p-4">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-2 h-4 w-3/4" />
                    </div>
                  ))
                : null}

              {!sponsorRequests.isLoading && !sponsorRequests.isError && (sponsorRequests.data?.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-5 text-sm text-muted-foreground">
                  {copy.noPromotionRequests}
                </div>
              ) : null}

              {!sponsorRequests.isLoading && sponsorRequests.isError ? (
                <div className="rounded-xl border border-dashed border-border/80 p-5 text-sm text-muted-foreground">
                  {copy.promotionHistoryUnavailable}
                </div>
              ) : null}

              {(sponsorRequests.data ?? []).map((request) => (
                <div key={request.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{request.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.companyName} | {formatSponsorCategoryLabel(request.category, language)}
                      </p>
                    </div>
                    <Badge className={sponsorStatusStyles[request.status]} variant="outline">
                      {formatStatus(request.status, copy)}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{request.description}</p>

                  {request.imageUrl ? (
                    <img
                      src={normalizeAssetUrl(request.imageUrl)}
                      alt={request.title}
                      className="mt-3 h-24 w-24 rounded-xl border border-border object-cover"
                    />
                  ) : null}

                  {isOtherSponsorCategory(request.category) && request.otherReason ? (
                    <p className="mt-2 text-xs text-muted-foreground">{copy.otherReason}: {request.otherReason}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{copy.points(request.requestedPointsReward)}</Badge>
                    <Badge variant="outline">{copy.xp(request.requestedXpReward)}</Badge>
                    <Badge variant="outline">{copy.people(request.maxCompletions)}</Badge>
                    <Badge variant="outline">{copy.levelShort(request.minLevel)}</Badge>
                    {request.platform ? (
                      <Badge variant="outline" className="gap-1">
                        <Globe2 className="h-3.5 w-3.5" />
                        {request.platform}
                      </Badge>
                    ) : null}
                  </div>

                  {request.reviewNote ? (
                    <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                      <p className="font-medium">{copy.reviewNote}</p>
                      <p className="mt-1 text-muted-foreground">{request.reviewNote}</p>
                    </div>
                  ) : null}

                  {request.status === "accepted" && request.publishedQuest ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <div>
                        <p className="font-medium">{copy.published}</p>
                        <p className="text-muted-foreground">{request.publishedQuest.title}</p>
                      </div>
                    </div>
                  ) : null}

                  {request.status === "rejected" ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm">
                      <XCircle className="mt-0.5 h-4 w-4 text-rose-600 dark:text-rose-300" />
                      <div>
                        <p className="font-medium">{copy.notApproved}</p>
                        <p className="text-muted-foreground">{copy.reviseRequest}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.leaderboard}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.rank}</TableHead>
                    <TableHead>{copy.user}</TableHead>
                    <TableHead>{copy.level}</TableHead>
                    <TableHead>{copy.pointsLabel}</TableHead>
                    <TableHead>{copy.xpLabel}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.data
                    ? stats.data.leaderboard.map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{entry.username}</TableCell>
                          <TableCell>{entry.level}</TableCell>
                          <TableCell>{entry.points}</TableCell>
                          <TableCell>{entry.xp}</TableCell>
                        </TableRow>
                      ))
                    : stats.isLoading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Skeleton className="h-4 w-6" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-28" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-10" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-16" />
                            </TableCell>
                          </TableRow>
                        ))
                      : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-sm text-muted-foreground">
                              {copy.leaderboardUnavailable}
                            </TableCell>
                          </TableRow>
                        )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </DeferredSection>
      </div>
    </>
  );
}
