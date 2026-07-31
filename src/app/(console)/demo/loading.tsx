export default function DemoLoading() {
  return (
    <div className="pt-2" aria-busy="true" aria-label="데모 데이터 불러오는 중">
      <div className="h-7 w-48 animate-pulse rounded bg-surface-raised" />
      <div className="mt-2 h-4 w-[32rem] max-w-full animate-pulse rounded bg-surface-raised" />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="h-44 animate-pulse rounded-xl border border-border bg-surface" />
        <div className="h-44 animate-pulse rounded-xl border border-border bg-surface" />
      </div>
    </div>
  );
}
