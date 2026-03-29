"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  ClipboardList,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { useAdminDashboardStats } from "@/backoffice/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/format";

function formatCount(value: number) {
  return formatNumber(value);
}

const quickLinks = [
  {
    title: "Quest reviews",
    description: "Check pending proofs and update live task rewards.",
    href: "/backoffice/dashboard/quests",
    icon: ShieldCheck
  },
  {
    title: "Sponsor requests",
    description: "Approve, reject, and publish promotions into sponsored tasks.",
    href: "/backoffice/dashboard/sponsors",
    icon: Megaphone
  },
  {
    title: "Redemptions",
    description: "Paste request codes, inspect delivery info, and mark delivered or refund.",
    href: "/backoffice/dashboard/redemptions",
    icon: ClipboardList
  },
  {
    title: "Products",
    description: "Create offers, update stock, and manage product details.",
    href: "/backoffice/dashboard/products",
    icon: Boxes
  }
] as const;

export default function BackofficeDashboardPage() {
  const stats = useAdminDashboardStats();

  if (stats.isLoading && !stats.data) {
    return <LoadingCard label="Loading dashboard..." />;
  }

  if (!stats.data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Dashboard statistics are not available right now.
        </CardContent>
      </Card>
    );
  }

  const reviewBacklog =
    stats.data.totals.pendingSponsorRequests +
    stats.data.totals.pendingQuestSubmissions +
    stats.data.totals.pendingRedemptions;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Home"
        subtitle="Website activity, review queues, and recent updates from one backoffice dashboard."
        right={
          <>
            <Badge variant="secondary">Members: {formatCount(stats.data.totals.users)}</Badge>
            <Badge variant="secondary">Open reviews: {formatCount(reviewBacklog)}</Badge>
            <Badge variant="secondary">Products: {formatCount(stats.data.totals.products)}</Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Members",
            value: formatCount(stats.data.totals.users),
            hint: `${formatCount(stats.data.totals.referrals)} referrals recorded`,
            icon: Users
          },
          {
            label: "Live tasks",
            value: formatCount(stats.data.totals.activeQuests),
            hint: `${formatCount(stats.data.totals.sponsoredQuests)} sponsored tasks`,
            icon: Sparkles
          },
          {
            label: "Products",
            value: formatCount(stats.data.totals.products),
            hint: `${formatCount(stats.data.recentProducts.length)} recent product updates`,
            icon: Boxes
          },
          {
            label: "Review queue",
            value: formatCount(reviewBacklog),
            hint: `${formatCount(stats.data.totals.pendingSponsorRequests)} sponsor, ${formatCount(
              stats.data.totals.pendingQuestSubmissions
            )} proof, ${formatCount(stats.data.totals.pendingRedemptions)} redemption`,
            icon: ClipboardList
          }
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.6rem] border-border/70 bg-card/88 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardDescription>{item.label}</CardDescription>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/45">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
              <CardTitle className="text-3xl tracking-tight">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Last 7 days
            </CardTitle>
            <CardDescription>Daily signups, sponsor requests, and redemption activity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[20rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.data.recentActivity} barGap={10}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "rgba(255,122,24,0.08)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    background: "rgba(15, 23, 42, 0.96)",
                    color: "#fff"
                  }}
                />
                <Bar dataKey="users" fill="rgba(255,122,24,0.92)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="sponsorRequests" fill="rgba(94, 234, 212, 0.82)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="redemptions" fill="rgba(96, 165, 250, 0.82)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Go straight to the busiest admin areas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((item) => (
              <div key={item.href} className="rounded-[1.35rem] border border-border/70 bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/45">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full justify-between">
                  <Link href={item.href}>
                    Open {item.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle>Newest members</CardTitle>
            <CardDescription>Latest accounts to join the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.data.recentUsers.map((user) => (
              <div key={user.id} className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                <p className="font-medium">{user.username}</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Level {user.level}</Badge>
                  <Badge variant="outline">{formatDate(user.createdAt)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle>Latest sponsor requests</CardTitle>
            <CardDescription>Most recent promotion requests waiting in the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.data.recentSponsorRequests.map((request) => (
              <div key={request.id} className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                <p className="font-medium">{request.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {request.companyName} by {request.submittedBy?.username ?? "Member"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{request.status}</Badge>
                  <Badge variant="outline">{formatCount(request.maxCompletions)} people</Badge>
                  <Badge variant="outline">{formatDate(request.createdAt)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] border-border/70 bg-card/88 shadow-sm">
          <CardHeader>
            <CardTitle>Recent products</CardTitle>
            <CardDescription>Newest products added to the rewards catalog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.data.recentProducts.map((product) => (
              <div key={product.id} className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                <p className="font-medium">{product.title}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{formatCount(product.pointsCost)} pts</Badge>
                  <Badge variant="outline">Stock {formatCount(product.stock)}</Badge>
                  <Badge variant="outline">{formatDate(product.createdAt)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
