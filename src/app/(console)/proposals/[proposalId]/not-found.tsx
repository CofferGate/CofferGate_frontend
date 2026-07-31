export default function ProposalNotFound() {
  return (
    <div>
      <h1 className="flex items-baseline gap-2 text-2xl font-medium text-foreground">
        제안을 찾을 수 없습니다
        <span className="text-sm font-normal text-foreground-subtle">
          Proposal Not Found
        </span>
      </h1>
      <p className="mt-1 text-sm text-foreground-muted">
        요청한 proposal_id에 해당하는 제안이 존재하지 않습니다.
      </p>
    </div>
  );
}
