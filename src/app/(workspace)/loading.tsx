import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div
      aria-label="Carregando página"
      aria-busy="true"
      className="flex flex-col gap-6"
      role="status"
    >
      <span className="sr-only">Carregando página…</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-52 max-w-full rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-2xl border border-graphite-600 bg-graphite-700 shadow-card" />
        <Skeleton className="h-28 rounded-2xl border border-graphite-600 bg-graphite-700 shadow-card" />
      </div>
      <Skeleton className="h-72 rounded-2xl border border-graphite-600 bg-graphite-700 shadow-card" />
    </div>
  );
}
