import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { MemberHomePage } from "@/components/home/member-home-page";
import { PublicLandingPage } from "@/components/home/public-landing-page";
import { AppShell } from "@/components/layout/app-shell";
import type { Reward } from "@/lib/types";
import { FRONTOFFICE_SESSION_COOKIE } from "@/server/utils/auth-cookies";
import { verifySessionToken } from "@/server/utils/jwt";
import { listRewards } from "@/server/services/reward.service";

const getCachedLandingRewards = unstable_cache(
  async () => {
    return (await listRewards()).map((reward) => ({
      ...reward,
      tndPrice: reward.tndPrice ?? null,
      plans: Array.isArray(reward.plans) ? (reward.plans as Reward["plans"]) : null,
      deliveryFields: Array.isArray(reward.deliveryFields)
        ? (reward.deliveryFields as Reward["deliveryFields"])
        : null,
      createdAt: reward.createdAt.toISOString()
    }));
  },
  ["public-landing-rewards"],
  { revalidate: 60 }
);

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(FRONTOFFICE_SESSION_COOKIE)?.value ?? null;
  let hasValidFrontofficeSession = false;

  if (token) {
    try {
      const auth = verifySessionToken(token);
      hasValidFrontofficeSession = auth.scope === "frontoffice";
    } catch {
      hasValidFrontofficeSession = false;
    }
  }

  if (hasValidFrontofficeSession) {
    return (
      <AppShell>
        <MemberHomePage />
      </AppShell>
    );
  }

  const rewards = await getCachedLandingRewards();

  return <PublicLandingPage rewards={rewards} />;
}
