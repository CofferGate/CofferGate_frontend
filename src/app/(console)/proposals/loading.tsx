export default function ProposalsLoading() {
  return (
    <div aria-busy="true" aria-label="제안 목록 불러오는 중">
      <div className="h-7 w-20 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 h-16 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="mt-4 h-64 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}
