import { Skeleton } from "@/components/ui/skeleton";

export function MarketingLoading() {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[2rem] border border-border/70 bg-card/80 px-5 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-12 w-40 rounded-2xl" />
            <div className="hidden items-center gap-2 md:flex">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-sm">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="mt-6 h-14 w-full max-w-2xl" />
            <Skeleton className="mt-3 h-14 w-4/5 max-w-xl" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-5/6 max-w-xl" />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Skeleton className="h-11 w-40 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm">
            <Skeleton className="h-5 w-28" />
            <div className="mt-5 grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/70 p-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-4/5" />
                  <Skeleton className="mt-4 h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5 shadow-sm">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <div className="mt-6 grid gap-3">
                {Array.from({ length: 3 }).map((__, itemIndex) => (
                  <Skeleton key={itemIndex} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
