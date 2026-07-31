export default function DashboardLoading() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="대시보드 불러오는 중">
      <div>
        <div className="h-7 w-32 animate-pulse rounded bg-surface-raised" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-surface-raised" />
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
      <div className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}
