import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(21rem,0.75fr)]">
        <div className="space-y-6">
          <Card className="rounded-[2rem]">
            <CardContent className="p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <Skeleton className="aspect-square w-full max-w-[220px] rounded-[1.35rem]" />
                <div className="min-w-0 flex-1 space-y-3">
                  <Skeleton className="h-9 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Skeleton className="h-7 w-28 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-40 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full rounded-[1.3rem]" />
              <Skeleton className="h-24 w-full rounded-[1.3rem]" />
              <Skeleton className="h-24 w-full rounded-[1.3rem]" />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2rem]">
          <CardHeader className="items-center text-center space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-5">
            <Skeleton className="h-24 w-full rounded-[1.4rem]" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-[1.2rem]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
