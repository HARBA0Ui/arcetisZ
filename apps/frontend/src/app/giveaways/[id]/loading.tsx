import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GiveawayDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-9 w-52" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="space-y-6">
        <Card className="rounded-[2rem] border-border/70 bg-card/95">
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full rounded-[1.5rem]" />
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/70 bg-card/95">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-[1.35rem]" />
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/70 bg-card/95">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-[1.2rem]" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
