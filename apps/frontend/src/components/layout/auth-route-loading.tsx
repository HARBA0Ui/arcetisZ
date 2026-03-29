import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthRouteLoading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-20 w-60 rounded-2xl" />
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
