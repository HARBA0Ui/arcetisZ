"use client";

import { FormEvent, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminConfig, useUpdatePlatformConfig } from "@/backoffice/hooks/useAdmin";
import { getApiError } from "@/lib/api";

export default function BackofficeConfigPage() {
  const config = useAdminConfig();
  const updateConfig = useUpdatePlatformConfig();
  const toast = useToast();

  const [form, setForm] = useState({
    maxXpPerDay: 200,
    maxPointsPerDay: 300,
    maxSocialTasksPerDay: 2,
    redemptionCooldownHours: 48,
    maxReferralsPerDay: 10,
    referralRewardLevel: 2,
    referralPointsReward: 200,
    referralXpReward: 100,
    maxSponsorRequestsPerUser: 3,
    sponsorRequestWindowDays: 30,
    redemptionRequestExpiryHours: 12,
    spinCooldownHours: 24,
    spinMinLevel: 2
  });
  const [spinItemsJson, setSpinItemsJson] = useState("[]");

  useEffect(() => {
    if (!config.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      maxXpPerDay: config.data.maxXpPerDay,
      maxPointsPerDay: config.data.maxPointsPerDay,
      maxSocialTasksPerDay: config.data.maxSocialTasksPerDay,
      redemptionCooldownHours: config.data.redemptionCooldownHours,
      maxReferralsPerDay: config.data.maxReferralsPerDay,
      referralRewardLevel: config.data.referralRewardLevel,
      referralPointsReward: config.data.referralPointsReward,
      referralXpReward: config.data.referralXpReward,
      maxSponsorRequestsPerUser: config.data.maxSponsorRequestsPerUser,
      sponsorRequestWindowDays: config.data.sponsorRequestWindowDays,
      redemptionRequestExpiryHours: config.data.redemptionRequestExpiryHours,
      spinCooldownHours: config.data.spinCooldownHours,
      spinMinLevel: config.data.spinMinLevel
    });
    setSpinItemsJson(JSON.stringify(config.data.spinItems ?? [], null, 2));
  }, [config.data]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const spinItems = JSON.parse(spinItemsJson);
      await updateConfig.mutateAsync({
        ...form,
        spinItems
      });
      toast.success("Config updated", "Platform limits saved.");
    } catch (error) {
      const message = error instanceof SyntaxError ? "Spin items JSON is invalid" : getApiError(error);
      toast.error("Config update failed", message);
    }
  };

  return (
    <div>
      <SectionHeader title="Config" subtitle="Tune global limits and spin wheel configuration." />
      {config.isLoading ? <LoadingCard label="Loading platform config..." /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Platform Config</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            {(
              [
                "maxXpPerDay",
                "maxPointsPerDay",
                "maxSocialTasksPerDay",
                "redemptionCooldownHours",
                "maxReferralsPerDay",
                "referralRewardLevel",
                "referralPointsReward",
                "referralXpReward",
                "maxSponsorRequestsPerUser",
                "sponsorRequestWindowDays",
                "redemptionRequestExpiryHours",
                "spinCooldownHours",
                "spinMinLevel"
              ] as const
            ).map((field) => (
              <div key={field}>
                <Label>{field}</Label>
                <Input
                  type="number"
                  value={form[field]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [field]: Number(e.target.value)
                    }))
                  }
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <Label>Spin Wheel Items JSON</Label>
              <Textarea
                rows={12}
                className="font-mono text-xs"
                value={spinItemsJson}
                onChange={(event) => setSpinItemsJson(event.target.value)}
              />
            </div>

            <Button className="md:col-span-2" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Saving...
                </span>
              ) : (
                "Save Config"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Login Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 text-[hsl(var(--arcetis-ember))]" />
              <div>
                <p className="font-medium">Email code required on every admin login</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Backoffice sign-in now requires your password first, then a 6-digit verification code sent to the admin email address on the account.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works</p>
              <p className="mt-2">1. Enter your admin email and password.</p>
              <p className="mt-1">2. Copy the 6-digit code from your inbox.</p>
              <p className="mt-1">3. Paste it into the backoffice login screen to finish signing in.</p>
              <p className="mt-3">
                If SMTP is unavailable in local development, the current code is shown directly on the login screen as a preview.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
