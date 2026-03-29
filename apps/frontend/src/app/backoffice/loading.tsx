import { BackofficeRouteLoading } from "@/backoffice/components/backoffice/route-loading";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10">
      <BackofficeRouteLoading label="Opening backoffice..." />
    </main>
  );
}
