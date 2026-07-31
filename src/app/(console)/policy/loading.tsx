export default function PolicyLoading() {
  return (
    <div className="pt-2" aria-busy="true" aria-label="운영 정책 불러오는 중">
      <div className="h-7 w-28 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 h-28 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="mt-7 space-y-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
            <div className="mt-3 h-24 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
