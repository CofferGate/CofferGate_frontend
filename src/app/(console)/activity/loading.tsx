export default function ActivityLoading() {
  return (
    <div className="pt-2" aria-busy="true" aria-label="활동 기록 불러오는 중">
      <div className="h-7 w-28 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 space-y-px border-y border-border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex gap-5 border-b border-border/70 py-4 last:border-0">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-raised" />
            <div className="h-4 flex-1 animate-pulse rounded bg-surface-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
