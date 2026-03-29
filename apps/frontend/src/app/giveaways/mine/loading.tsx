import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyGiveawaysLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-9 w-44" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card className="rounded-[1.8rem] border-border/70 bg-card/92 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-[1.8rem] border-border/70 bg-card/95">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full rounded-[1.2rem]" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

