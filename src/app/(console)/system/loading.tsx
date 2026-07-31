export default function SystemStatusLoading() {
  return (
    <div className="pt-2" aria-busy="true" aria-label="시스템 상태 불러오는 중">
      <div className="h-7 w-28 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-12 animate-pulse border-b border-border bg-surface-raised/40" />
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-border/70 px-5 py-4 last:border-0"
          >
            <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-raised" />
            <div className="h-4 flex-1 animate-pulse rounded bg-surface-raised" />
            <div className="h-6 w-16 animate-pulse rounded bg-surface-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
