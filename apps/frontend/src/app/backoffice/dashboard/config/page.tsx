"use client";

import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useBeginTwoFactorSetup,
  useDisableTwoFactor,
  useEnableTwoFactor,
  useTwoFactorStatus
} from "@/backoffice/hooks/useAuth";
import { useAdminConfig, useUpdatePlatformConfig } from "@/backoffice/hooks/useAdmin";
import { getApiError } from "@/lib/api";

export default function BackofficeConfigPage() {
  const config = useAdminConfig();
  const updateConfig = useUpdatePlatformConfig();
  const twoFactorStatus = useTwoFactorStatus();
  const beginTwoFactorSetup = useBeginTwoFactorSetup();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();
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
  const [setup, setSetup] = useState<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!config.data) return;
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
          <CardTitle>Backoffice 2FA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-border/70 bg-background/55 p-4 text-sm text-muted-foreground">
            <p>
              Status:{" "}
              <span className="font-medium text-foreground">
                {twoFactorStatus.data?.enabled ? "Enabled" : "Disabled"}
              </span>
            </p>
            <p className="mt-2">
              Recovery codes remaining:{" "}
              <span className="font-medium text-foreground">
                {twoFactorStatus.data?.recoveryCodesRemaining ?? "-"}
              </span>
            </p>
          </div>

          {!twoFactorStatus.data?.enabled ? (
            <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[hsl(var(--arcetis-ember))]" />
                <div>
                  <p className="font-medium">Secure admin sign-in with an authenticator app</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start setup, scan the QR code, then enter the 6-digit code to enable TOTP.
                  </p>
                </div>
              </div>

              {!setup ? (
                <Button
                  type="button"
                  disabled={beginTwoFactorSetup.isPending}
                  onClick={async () => {
                    try {
                      const nextSetup = await beginTwoFactorSetup.mutateAsync();
                      setSetup(nextSetup);
                      setEnableCode("");
                      setRecoveryCodes([]);
                      toast.success("2FA setup started", "Scan the QR code and enter your authenticator code.");
                    } catch (error) {
                      toast.error("2FA setup failed", getApiError(error));
                    }
                  }}
                >
                  {beginTwoFactorSetup.isPending ? "Preparing..." : "Start 2FA setup"}
                </Button>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <img src={setup.qrCodeDataUrl} alt="2FA QR code" className="rounded-xl border border-border/70 bg-white p-3" />
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Manual setup secret</p>
                      <p className="mt-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 font-mono text-sm">
                        {setup.secret}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enable-2fa-code">Authenticator code</Label>
                      <Input
                        id="enable-2fa-code"
                        value={enableCode}
                        onChange={(event) => setEnableCode(event.target.value)}
                        placeholder="123456"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        disabled={enableTwoFactor.isPending}
                        onClick={async () => {
                          try {
                            const result = await enableTwoFactor.mutateAsync({ code: enableCode });
                            setRecoveryCodes(result.recoveryCodes);
                            setSetup(null);
                            setEnableCode("");
                            toast.success("2FA enabled", "Save your recovery codes somewhere safe.");
                          } catch (error) {
                            toast.error("Enable 2FA failed", getApiError(error));
                          }
                        }}
                      >
                        {enableTwoFactor.isPending ? "Enabling..." : "Enable 2FA"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSetup(null);
                          setEnableCode("");
                        }}
                      >
                        Cancel setup
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-start gap-3">
                <ShieldOff className="mt-0.5 h-5 w-5 text-red-300" />
                <div>
                  <p className="font-medium">Disable 2FA</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter a current authenticator or recovery code to remove extra sign-in protection.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disable-2fa-code">Authenticator or recovery code</Label>
                <Input
                  id="disable-2fa-code"
                  value={disableCode}
                  onChange={(event) => setDisableCode(event.target.value)}
                  placeholder="123456 or recovery code"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={disableTwoFactor.isPending}
                onClick={async () => {
                  try {
                    await disableTwoFactor.mutateAsync({ code: disableCode });
                    setDisableCode("");
                    toast.success("2FA disabled", "Backoffice sign-in now uses password only.");
                  } catch (error) {
                    toast.error("Disable 2FA failed", getApiError(error));
                  }
                }}
              >
                {disableTwoFactor.isPending ? "Disabling..." : "Disable 2FA"}
              </Button>
            </div>
          )}

          {recoveryCodes.length ? (
            <div className="rounded-xl border border-[hsl(var(--arcetis-ember))]/30 bg-[rgba(255,122,24,0.06)] p-4">
              <p className="font-medium">Recovery codes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Store these once. Each code works a single time if your authenticator is unavailable.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {recoveryCodes.map((code) => (
                  <div key={code} className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 font-mono text-sm">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
