/** SPEC 20: errors carry code, retryable, proposalId, requestId — never just a message. */
export interface ApiErrorInit {
  code: string;
  message: string;
  retryable: boolean;
  proposalId?: string;
  requestId: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly proposalId?: string;
  readonly requestId: string;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.retryable = init.retryable;
    this.proposalId = init.proposalId;
    this.requestId = init.requestId;
  }
}
