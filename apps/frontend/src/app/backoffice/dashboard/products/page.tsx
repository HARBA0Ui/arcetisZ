"use client";

import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { PaginationControls } from "@/backoffice/components/backoffice/pagination-controls";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { LoadingCard } from "@/backoffice/components/backoffice/loading-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminRewards } from "@/backoffice/hooks/useAdmin";
import { normalizeAssetUrl } from "@/lib/assets";
import { formatNumber } from "@/lib/format";
import { getRewardStartingPointsCost, getRewardStartingTndPrice } from "@/lib/reward-options";

export default function BackofficeProductsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rewards = useAdminRewards({
    q: query || undefined,
    page,
    pageSize: 10
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Products"
        subtitle="Browse the reward catalog, search products quickly, and open each one for plan or stock updates."
        right={
          <Button asChild>
            <Link href="/backoffice/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Create product
            </Link>
          </Button>
        }
      />

      {rewards.isLoading && !rewards.data ? <LoadingCard label="Loading products..." /> : null}

      {rewards.data ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Product Catalog</CardTitle>
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                  placeholder="Search products by title or description"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.data.items.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {reward.imageUrl ? (
                          <img
                            src={normalizeAssetUrl(reward.imageUrl)}
                            alt={reward.title}
                            className="h-8 w-8 rounded-md border border-border object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md border border-border bg-muted" />
                        )}
                        <div>
                          <div>{reward.title}</div>
                          <div className="text-xs text-muted-foreground">{reward.plans?.length ?? 1} plan(s)</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatNumber(getRewardStartingPointsCost(reward))} pts</div>
                        {typeof getRewardStartingTndPrice(reward) === "number" ? (
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(getRewardStartingTndPrice(reward) ?? 0, {
                              maximumFractionDigits: 2
                            })}{" "}
                            TND
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.stock > 0 ? "secondary" : "outline"}>{reward.stock}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/backoffice/dashboard/products/${reward.id}`}>
                          View details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <PaginationControls
              page={rewards.data.page}
              totalPages={rewards.data.totalPages}
              total={rewards.data.total}
              itemLabel="product"
              onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
              onNext={() => setPage((current) => Math.min(current + 1, rewards.data.totalPages))}
            />
          </CardContent>
        </Card>
      ) : rewards.isLoading ? null : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Products are not available right now.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
