"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search } from "lucide-react";
import { PaginationControls } from "@/backoffice/components/backoffice/pagination-controls";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { Spinner } from "@/components/common/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminUserStats, useAdminUsers } from "@/backoffice/hooks/useAdmin";

export default function BackofficeUsersPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const users = useAdminUsers({
    q: query || undefined,
    page,
    pageSize: 10
  });
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const selectedUserStats = useAdminUserStats(selectedUserId);

  useEffect(() => {
    const pageUsers = users.data?.items ?? [];

    if (!pageUsers.length) {
      setSelectedUserId(undefined);
      return;
    }

    if (!selectedUserId || !pageUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(pageUsers[0].id);
    }
  }, [selectedUserId, users.data]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div>
      <SectionHeader title="Users" subtitle="View user accounts and behavior metrics." />
      {users.isLoading ? <LoadingCard label="Loading users..." /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-10"
                placeholder="Search by username, email, or referral code"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users.data?.items ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.level}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedUserId(user.id)}>
                        Stats
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.data ? (
              <PaginationControls
                page={users.data.page}
                totalPages={users.data.totalPages}
                total={users.data.total}
                itemLabel="user"
                onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
                onNext={() => setPage((current) => Math.min(current + 1, users.data.totalPages))}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedUserId ?? ""} onChange={(e) => setSelectedUserId(e.target.value || undefined)}>
              <option value="">Select user</option>
              {(users.data?.items ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </Select>
            {selectedUserStats.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner /> Loading user stats...
              </div>
            ) : selectedUserStats.data ? (
              <div className="space-y-4">
                <div className="h-60 rounded-lg border border-border bg-card/60 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { key: "Completions", value: selectedUserStats.data.stats.completionsCount },
                        { key: "Redemptions", value: selectedUserStats.data.stats.redemptionsTotal },
                        { key: "Referrals", value: selectedUserStats.data.stats.referralsSent },
                        { key: "Points", value: selectedUserStats.data.stats.totalPointsDelta }
                      ]}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="key" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: "hsla(0, 0%, 100%, 0.05)" }}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "10px",
                          color: "hsl(var(--foreground))"
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground">Quest completions</p>
                    <p className="text-xl font-semibold">{selectedUserStats.data.stats.completionsCount}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground">Redemptions</p>
                    <p className="text-xl font-semibold">{selectedUserStats.data.stats.redemptionsTotal}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground">Referrals sent</p>
                    <p className="text-xl font-semibold">{selectedUserStats.data.stats.referralsSent}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-muted-foreground">Total points delta</p>
                    <p className="text-xl font-semibold">{selectedUserStats.data.stats.totalPointsDelta}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pick a user to view stats.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
