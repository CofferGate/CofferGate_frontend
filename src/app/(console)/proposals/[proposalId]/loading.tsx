export default function ProposalDetailLoading() {
  return (
    <div aria-busy="true" aria-label="제안 상세 불러오는 중">
      <div className="h-7 w-28 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-surface-raised" />
      <div className="mt-5 h-44 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="mt-8 space-y-5 border-l border-border pl-7">
        <div className="h-36 animate-pulse rounded-lg bg-surface" />
        <div className="h-36 animate-pulse rounded-lg bg-surface" />
        <div className="h-48 animate-pulse rounded-lg bg-surface" />
      </div>
    </div>
  );
}
