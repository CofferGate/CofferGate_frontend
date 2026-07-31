# CofferGate Frontend Implementation Spec

> 문서 상태: 심사 기준 강화 개정안 · 구현 계약 v2
> 프로젝트 트랙: B. Autonomous On-chain Settlement

**핵심 구현 원칙**: 브라우저는 자금을 서명하거나 정책을 판정하지 않는다. 프론트엔드는 AI 제안, 결정론적 정책 판정, 온체인 실행 결과를 이해하기 쉽게 보여주고 운영자가 자동화 범위를 통제하게 하는 운영 콘솔이다.

---

## 1. 제품 요약

CofferGate는 Solana-native 프로토콜 재무 운영팀을 위한 제한형 트레저리 운영 에이전트다.

- 핵심 자산은 기존 Squads Reserve Vault에 유지한다.
- 자동화 대상은 최소 운영 잔고만 가진 Operations Wallet이다.
- Gemini는 시장 상태와 재무 목표를 해석해 만료 시간이 있는 제안(Proposal)을 생성한다.
- 코드 기반 Policy Gate가 AUTO, ESCALATE, BLOCK을 결정한다.
- AUTO인 경우 매 단계 사람 승인 없이 Jupiter 거래를 재검사하고 simulation 후 Cloud KMS로 서명한다.
- 모든 판단, 정책 판정, 서명 요청, transaction signature와 전후 잔고는 하나의 `proposal_id`로 연결한다.

## 2. 심사 기준 대응

| 심사 기준 | 프론트엔드가 증명해야 하는 것 |
|---|---|
| 혁신성 및 UX | 운영자가 AI를 맹신하지 않고 근거, 정책 경계, 실행 결과를 한 흐름에서 이해할 수 있음 |
| AI 활용도 | Gemini가 만든 제안, 근거, confidence, 데이터 시각, Risk Review가 명확히 노출됨 |
| 기술 완성도 및 연동 | Google Cloud 서비스 상태, Jupiter 검증, Solana simulation과 transaction signature가 실제 데이터로 연결됨 |
| 실제 구동 여부 | 정상 AUTO 실행과 서명 전 BLOCK이 동일 UI에서 재현되고 Explorer 링크로 확인됨 |

데모 전에는 마지막 항목의 실제 값만 Mock 데이터로 대체할 수 있다. 최종 제출 시 Mock 표시는 제거하고 실제 거래 및 차단 결과를 연결해야 한다.

## 3. 사용자와 권한

### 3.1 대표 사용자
Solana 프로토콜의 재무 운영자. Squads에 SOL·USDC 핵심 자산을 보관하고, 운영 지갑의 잔고 확인, 소액 스왑, 운영비 보충과 감사 보고를 반복한다.

### 3.2 역할

| 역할 | 허용 작업 | 금지 작업 |
|---|---|---|
| Viewer | 대시보드, 제안, 실행 결과, 감사 로그 조회 | 승인, 정책 변경, 회로 차단기 변경 |
| Operator | Viewer 권한 + ESCALATE 승인·거절, 수동 평가 요청 | 직접 서명, 임의 거래 제출 |
| Admin | 정책 버전 작성, 회로 차단기 설정 | KMS 키 재료 조회, 브라우저 서명 |

데모 MVP는 하나의 Operator 세션으로 동작해도 된다. 단, UI 컴포넌트는 역할별 비활성화 상태를 표현할 수 있어야 한다.

## 4. UX 원칙

### 4.1 AI와 정책을 같은 상태로 표현하지 않는다
- AI 결과는 **제안**으로 표시한다.
- Policy Gate 결과는 **판정**으로 표시한다.
- 실행 결과는 **온체인 증거**로 표시한다.
- AI confidence가 높아도 정책 위반이면 BLOCK이다.

### 4.2 모든 행동에는 이유와 시각이 있다
제안 카드에는 다음이 항상 함께 노출되어야 한다: `action`, `input/output asset`, `amount`, `rationale`, `confidence`, `evidence references`, `data_as_of`, `expires_at`, `policy_version`

### 4.3 상태보다 사용자 질문을 먼저 해결한다

| 단계 | 사용자가 알고 싶은 질문 |
|---|---|
| Observe | 무엇이 바뀌었는가 |
| Propose | 왜 지금 움직이려는가 |
| Decide | 왜 실행 가능하거나 불가능한가 |
| Execute | 실제로 무엇이 일어났는가 |
| Audit | 어떤 정책과 증거로 연결되는가 |

### 4.4 자동화는 언제든 중단할 수 있다
전역 헤더에서 circuit breaker 상태를 항상 볼 수 있어야 한다. Admin 권한에서는 중단 버튼을 제공하되, 확인 모달에서 영향 범위와 현재 실행 중인 제안 수를 표시한다.

## 5. 기술 스택

| 영역 | 선택 |
|---|---|
| Framework | Next.js App Router + TypeScript |
| Styling | Tailwind CSS + CSS variables |
| Accessible primitives | Radix UI 또는 shadcn/ui |
| Server state | TanStack Query |
| Runtime validation | Zod |
| Forms | React Hook Form + Zod resolver |
| Charts | Recharts 또는 경량 SVG 컴포넌트 |
| Dates | date-fns |
| Testing | Vitest, React Testing Library, Playwright |
| Deployment | Public Next.js Cloud Run service |

정확한 패키지 버전은 구현 시작일의 stable 버전을 사용하고 lockfile로 고정한다. 실험/canary 버전은 사용하지 않는다.

## 6. 프론트엔드 배포 구조

```
Browser
 -> Public Next.js Cloud Run
 -> Next.js Route Handler / Server Action
 -> Google-signed OIDC
 -> Private Control Plane Cloud Run
 -> Firestore / Vertex AI / Private Executor
```

브라우저는 Control Plane, Private Executor, Cloud KMS, Solana RPC를 직접 호출하지 않는다. 모든 쓰기 요청은 Next.js 서버 계층을 통과한다.

## 7. 정보 구조와 라우트

| Route | 화면 | 목적 |
|---|---|---|
| `/` | Operations Dashboard | 현재 잔고, 자동화 상태, 최신 제안과 최근 실행을 한눈에 표시 |
| `/proposals` | Proposal Queue | 상태별 제안 목록과 필터 |
| `/proposals/[proposalId]` | Proposal Detail | AI 근거부터 정책 판정, 실행, 감사까지 전체 추적 |
| `/activity` | Activity Ledger | transaction signature 및 BLOCK 이벤트 감사 |
| `/policy` | Policy Viewer | 현재 정책 버전과 한도 확인 |
| `/system` | System Status | Cloud 서비스, RPC, Jupiter, circuit breaker 상태 |
| `/demo` | Demo Control | 3분 데모를 위한 정상·차단 시나리오 실행 |

최종 데모의 기본 진입점은 `/demo` 또는 `/` 중 하나로 고정한다. 심사 영상에서는 화면 이동을 최소화한다.

## 8. 전역 레이아웃

### 8.1 App Shell
- 좌측 내비게이션: Dashboard, Proposals, Activity, Policy, System
- 상단 바: 환경, cluster, Operations Wallet 주소 축약, circuit breaker, 데이터 최신 시각
- 콘텐츠 영역: 최대 폭 1440px
- 전역 알림: 실행 성공, BLOCK, 데이터 지연, 시스템 장애

### 8.2 항상 노출할 상태
- MAINNET 또는 DEVNET
- LIVE, SIMULATION, MOCK 데이터 모드
- circuit breaker: ACTIVE 또는 HALTED
- Operations Wallet 잔고
- 마지막 데이터 동기화 시각

MOCK 상태를 숨기지 않는다. 최종 제출 전 모든 데모 핵심 경로가 LIVE 또는 명시적인 DEVNET LIVE로 바뀌어야 한다.

## 9. 디자인 시스템

### 9.1 시각 방향
미래형 금융 운영 콘솔.
- 배경: deep navy
- 기본 패널: navy surface
- AUTO: green
- AI·제안: violet
- 데이터·연결: blue
- ESCALATE: amber
- BLOCK·위험: red

### 9.2 상태 색상

| 상태 | 색상 | 사용 위치 |
|---|---|---|
| OBSERVED | Blue | 관찰 데이터 |
| PROPOSED / AI_REVIEWED | Violet | AI 제안과 Risk Review |
| POLICY_APPROVED / AUTO | Green | 자동 실행 가능 |
| ESCALATED | Amber | 사람 승인 필요 |
| BLOCKED / FAILED | Red | 실행 금지 또는 실패 |
| EXECUTING / SUBMITTED | Cyan | 진행 중 |
| CONFIRMED / RECONCILED | Green | 온체인 확정 및 정산 |
| EXPIRED | Gray | 만료 |

색상만으로 상태를 구분하지 않는다. 모든 상태는 텍스트, 아이콘, 배지 중 최소 두 가지 수단으로 표현한다.

### 9.3 공통 컴포넌트
`StatusBadge`, `EnvironmentBadge`, `FreshnessIndicator`, `AssetAmount`, `WalletAddress`, `PolicyResult`, `RuleCheckList`, `EvidenceList`, `ProposalTimeline`, `TransactionLink`, `BalanceDelta`, `ServiceHealth`, `CircuitBreakerControl`, `EmptyState`, `ErrorState`, `Skeleton`

## 10. Operations Dashboard 상세 명세

### 10.1 목적
운영자가 10초 안에 "자금 상태, 자동화 가능 여부, 최신 제안, 최근 실행"을 판단하게 한다.

### 10.2 화면 구성
1. **Operations Wallet 카드**: SOL 잔고, USDC 잔고, 목표 USDC 잔고, 일일 사용 금액과 한도
2. **Automation 상태**: AUTO 활성 여부, circuit breaker, 현재 policy version, 허용 자산
3. **Latest Proposal**: action과 amount, rationale 한 줄, confidence, expires_at countdown, AUTO/ESCALATE/BLOCK
4. **Recent Activity**: 최근 5개 proposal, 상태·시각·signature 또는 block reason
5. **System Health**: Control Plane, Firestore, Executor, KMS, Jupiter, Solana RPC

### 10.3 사용자 동작
- 새 평가 실행: 백엔드에 수동 평가를 요청한다.
- 최신 제안 클릭: Proposal Detail로 이동한다.
- transaction signature 클릭: Solana Explorer 새 탭으로 이동한다.
- circuit breaker 클릭: Admin일 때만 확인 모달을 연다.

### 10.4 완료 조건
- 모든 카드에 loading, empty, stale, error 상태가 존재한다.
- expires_at이 지나면 실행 버튼을 즉시 비활성화한다.
- 데이터가 60초 이상 오래되면 Freshness 경고를 표시한다.
- 잔고와 금액은 원시 단위가 아니라 사용자 단위로 표시하며 원시 값은 상세에서 확인 가능하다.

## 11. Proposal Queue 상세 명세

**필터**: status, action, decision, created date, policy version, environment

**목록 필드**: proposal_id 축약, created_at, action, input/output asset, amount, decision, status, expires_at, transaction signature 또는 violation code

**정렬**: 기본은 최신 생성 순. ESCALATED 상태는 목록 상단 고정.

## 12. Proposal Detail 상세 명세 (핵심 증거 화면)

### 12.1 상단 Summary
proposal_id 전체 복사, status, decision, action과 amount, created_at/data_as_of/expires_at, policy_version

### 12.2 Observe
SOL/USDC 잔고, 목표 잔고, 가격, 변동성, 데이터 제공 시각, 데이터 출처

### 12.3 AI Proposal
Market Context 요약, Treasury Strategy 제안, Risk Review 반론, rationale, confidence, evidence_refs
→ AI 콘텐츠에는 "AI-generated proposal" 라벨을 표시한다.

### 12.4 Policy Decision
각 규칙을 체크 리스트로: allowed mint, per-transaction limit, daily limit, reserve threshold, quote freshness, slippage, price impact, allowed program, allowed signer, simulation, circuit breaker
→ 규칙 항목은 PASS/REVIEW/FAIL을 표시하고 실제 값과 기준 값을 함께 제공한다.

### 12.5 Execution
Jupiter route label, expected input/output, minimum output, slippage, simulation result, compute units, KMS key version 축약, transaction signature, submitted_at, confirmed_at, commitment

### 12.6 Reconciliation
before balance, after balance, expected delta, actual delta, reconciliation status

### 12.7 ESCALATE 동작
Operator에게 승인과 거절 제공.
- 승인 시 사유 입력은 선택
- 거절 시 사유 입력은 필수
- 정책 자체는 이 화면에서 수정하지 않음
- 만료된 제안은 승인 불가

## 13. Policy Viewer 상세 명세

**표시 항목**: policy_version, effective_from, allowed input/output mint, max transaction USD, daily limit USD, minimum reserve, max slippage bps, max price impact, quote max age seconds, allowed programs, allowed signers, circuit breaker parameters

**데모 기본값**:

| 항목 | 기본값 |
|---|---|
| 허용 자산 | SOL, USDC |
| 거래 한도 | 5 USD 이하 |
| 일일 한도 | 20 USD 이하 |
| quote max age | 15초 |
| max slippage | 50bps |
| simulation | 성공 필수 |

이 값은 데모용이며 투자 권고가 아니다.

## 14. Activity Ledger 상세 명세

시간순 이벤트: PROPOSAL_CREATED, AI_REVIEW_COMPLETED, POLICY_DECIDED, EXECUTION_CLAIMED, SIMULATION_SUCCEEDED, KMS_SIGNED, TRANSACTION_SUBMITTED, TRANSACTION_CONFIRMED, RECONCILED, BLOCKED, FAILED (각 이벤트별 표시 데이터는 원문 참고)

## 15. System Status 상세 명세

각 서비스 상태: healthy, degraded, down, unknown
대상: Control Plane, Vertex AI, Firestore, Private Executor, Cloud KMS, Jupiter API, Solana RPC

서비스 장애 시 내부 stack trace나 secret 값을 노출하지 않는다. 사용자에게는 영향과 가능한 행동만 표시한다.

## 16. Demo Control 상세 명세

### 16.1 목적
3분 이내에 정상 AUTO와 BLOCK을 안정적으로 시연한다.

### 16.2 시나리오
**정상 실행**: 잔고 부족 상태 로드 → AI 제안 생성 → 정책 PASS → simulation → KMS sign → submit → signature와 잔고 변화 표시

**차단 실행**: $5 초과 또는 미승인 프로그램 조건 로드 → 동일한 AI 제안 흐름 → Policy Gate FAIL → KMS 호출 없음 → BLOCK 코드 표시

### 16.3 안전장치
- LIVE 실행 버튼은 별도의 확인 모달을 사용한다.
- 환경과 최대 금액을 모달에 크게 표시한다.
- 중복 클릭을 막는다.
- 실행 중 새 시나리오 시작을 막는다.
- 데모 실패 시 마지막 성공 상태를 조작해 보여주지 않는다.

## 17. 프론트엔드 도메인 타입

```typescript
type ProposalStatus =
  | "OBSERVED" | "PROPOSED" | "AI_REVIEWED" | "POLICY_APPROVED"
  | "ESCALATED" | "BLOCKED" | "EXECUTING" | "SUBMITTED"
  | "CONFIRMED" | "FAILED" | "EXPIRED" | "RECONCILED";

type PolicyDecision = "AUTO" | "ESCALATE" | "BLOCK";
type ProposalAction = "NO_ACTION" | "SWAP";

interface Proposal {
  proposalId: string;
  action: ProposalAction;
  inputMint?: string;
  outputMint?: string;
  inputSymbol?: "SOL" | "USDC";
  outputSymbol?: "SOL" | "USDC";
  amountAtomic?: string;
  amountDisplay?: string;
  amountUsd?: number;
  rationale: string;
  confidence: number;
  evidenceRefs: EvidenceReference[];
  dataAsOf: string;
  expiresAt: string;
  policyVersion: string;
  decision?: PolicyDecision;
  status: ProposalStatus;
  ruleChecks: RuleCheck[];
  execution?: ExecutionSummary;
}

interface RuleCheck {
  code: string;
  label: string;
  result: "PASS" | "REVIEW" | "FAIL";
  actual?: string | number | boolean;
  expected?: string | number | boolean;
  message: string;
}
```

백엔드 응답은 UI에서 사용하기 전에 Zod로 검증한다. 검증 실패 시 정상 데이터처럼 렌더링하지 않고 telemetry를 기록한다.

## 18. API 계약

### 18.1 공통 응답
```json
{
  "data": {},
  "meta": {
    "requestId": "req_...",
    "generatedAt": "2026-07-29T05:00:00.000Z",
    "environment": "devnet"
  }
}
```

### 18.2 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| GET | /api/v1/dashboard | 대시보드 집계 |
| GET | /api/v1/proposals | 제안 목록 |
| GET | /api/v1/proposals/{id} | 제안 상세 |
| POST | /api/v1/evaluations | 수동 평가 시작 |
| POST | /api/v1/proposals/{id}/approve | ESCALATE 승인 |
| POST | /api/v1/proposals/{id}/reject | ESCALATE 거절 |
| GET | /api/v1/policy/current | 현재 정책 |
| GET | /api/v1/activity | 감사 이벤트 |
| GET | /api/v1/system/health | 서비스 상태 |
| POST | /api/v1/system/circuit-breaker | 회로 차단기 변경 |
| GET | /api/v1/events/stream | SSE 상태 이벤트 |
| GET | /api/v1/proposals/{id}/evidence | Evidence Mode |
| GET | /api/v1/proposals/{id}/proof | 상태 확정 전 polling fallback |
| GET | /api/v1/agent-runs/{id} | Agent Run Drawer |
| POST | /api/v1/proposals/{id}/execute | ESCALATE 승인 후 실행 |
| GET | /api/v1/system/readiness | System Status (10초 캐시) |

### 18.3 쓰기 요청 규칙
- 모든 POST 요청에 Idempotency-Key를 포함한다.
- 사용자가 연속 클릭해도 같은 키를 재사용한다.
- mutation 성공 후 관련 Query를 invalidate한다.
- 백엔드의 409는 일반 오류가 아니라 상태 충돌로 처리한다.

## 19. SSE 이벤트

```typescript
interface CofferGateEvent {
  eventId: string;
  proposalId?: string;
  type:
    | "PROPOSAL_UPDATED" | "EXECUTION_UPDATED" | "BALANCE_UPDATED"
    | "SYSTEM_HEALTH_UPDATED" | "CIRCUIT_BREAKER_UPDATED";
  occurredAt: string;
  version: number;
}
```

- SSE 연결이 끊기면 지수 백오프로 재연결하고 마지막 eventId를 전달한다.
- SSE가 실패해도 5초 polling으로 핵심 상태를 갱신할 수 있어야 한다.
- Last-Event-ID를 보존해 재연결하며 이벤트 순서를 eventId와 occurredAt으로 검증한다.
- proposal.updated, rulecheck.completed, execution.updated, proof.updated 이벤트를 처리한다.
- 중복 이벤트는 eventId로 제거하고 역방향 상태 전이를 UI 상태에 반영하지 않는다.
- system.degraded와 circuit_breaker.changed는 전역 배너로 즉시 표시한다.

## 20. 오류 처리

| HTTP | UI 처리 |
|---|---|
| 400 | 입력 또는 현재 상태가 잘못되었음을 필드 단위로 표시 |
| 401/403 | 권한 부족 안내, 민감 정보 미표시 |
| 404 | 제안 없음 |
| 409 | 이미 실행 중, 만료, 상태 충돌 안내 |
| 422 | 정책 위반 목록 표시 |
| 429 | 재시도 가능 시각 표시 |
| 502/503 | 외부 서비스 장애 및 자동 실행 중지 상태 표시 |
| 504 | 제출 상태 확인 중으로 전환, 성공/실패 단정 금지 |

오류 메시지는 message만 표시하지 말고 code, retryable, proposalId, requestId를 기록한다.

## 21. 상태 관리와 캐시

- 서버 상태는 TanStack Query에서 관리한다.
- UI 전용 상태만 React local state 또는 lightweight store를 사용한다.
- Proposal detail stale time: 2초 / Dashboard: 5초 / Policy: 60초 / System health: 10초
- 거래 mutation에 optimistic update를 사용하지 않는다.
- 백엔드 확인 전 CONFIRMED를 표시하지 않는다.

## 22. 보안 요구사항

- 브라우저 번들에 Jupiter API key, RPC key, GCP credential을 포함하지 않는다.
- KMS 키 이름 전체는 Admin 상세 화면 외에는 축약한다.
- private key 입력 UI를 만들지 않는다.
- wallet connect를 KMS Operations Wallet의 대체 수단으로 사용하지 않는다.
- address와 signature는 HTML escape 후 렌더링한다.
- 외부 Explorer 링크에는 noopener,noreferrer를 사용한다.
- mutation은 Next.js 서버 계층을 통해서만 호출한다.

## 23. 접근성 및 반응형

- WCAG AA 수준의 대비를 목표로 한다.
- 키보드만으로 모든 승인·거절·중단 작업이 가능해야 한다.
- 모든 상태 아이콘에 텍스트 라벨을 제공한다.
- 모바일에서는 모니터링 위주로 제공하고 LIVE 실행 버튼은 숨기거나 별도 확인 단계를 강화한다.
- 데모 기준 해상도: 1440×900, 1920×1080. 1280px 이하에서도 수평 스크롤 없이 핵심 흐름이 보여야 한다.

## 24. 로깅 및 분석

기록 이벤트: dashboard_viewed, evaluation_requested, proposal_opened, escalation_approved, escalation_rejected, circuit_breaker_changed, explorer_opened, api_error_shown, schema_validation_failed

자산 금액, 지갑 전체 주소, rationale 전문은 분석 도구에 전송하지 않는다.

## 25. 테스트 전략

**단위**: 금액 포맷, 상태별 색상·라벨, expires_at countdown, Zod schema, 정책 규칙 표시 순서

**컴포넌트**: Proposal card, Rule check list, Transaction link, Circuit breaker modal, 오류·빈 상태

**E2E**: 정상 AUTO 시나리오, 한도 초과 BLOCK, 미승인 프로그램 BLOCK, ESCALATE 승인과 거절, 제안 만료, RPC timeout 후 상태 조회, circuit breaker 활성화, SSE 재연결

## 26. Mock 전략

백엔드 개발 전에도 동일한 API schema로 개발한다.

Fixtures: `fixtures/normal-auto.json`, `fixtures/blocked-limit.json`, `fixtures/blocked-program.json`, `fixtures/escalated.json`, `fixtures/rpc-unknown.json`

Mock 응답은 `meta.environment = "mock"`으로 표시한다. 실제 API 전환 시 컴포넌트 코드를 변경하지 않고 data provider만 교체한다.

## 27. 구현 순서 (권장)

1. App shell과 디자인 토큰
2. 공통 domain type과 Zod schema
3. Mock API와 fixture
4. Dashboard
5. Proposal Detail
6. Demo Control
7. Activity Ledger
8. Policy Viewer
9. System Status
10. 실제 API·SSE 연결
11. 접근성·E2E·데모 리허설

## 28. Definition of Done

- 정상 AUTO와 BLOCK 시나리오가 각각 90초 이내 재현된다.
- AI 제안과 Policy Gate 판정이 시각적으로 혼동되지 않는다.
- 모든 핵심 화면에 loading, empty, stale, error 상태가 있다.
- transaction signature가 실제 Explorer로 연결된다.
- BLOCK 시 KMS 미호출이 화면과 이벤트 로그에 표시된다.
- 환경과 Mock 여부가 항상 표시된다.
- 프론트엔드에 secret 또는 private key가 없다.
- Playwright 핵심 시나리오가 통과한다.
- 3분 데모 영상에서 화면 이동이 5회 이하이다.

## 29. Evidence Mode (심사 대응 강화)

Evidence Mode는 심사위원과 운영자가 하나의 proposal_id를 따라 판단부터 정산까지 검증하는 읽기 중심 화면이다. 기존 Proposal Detail을 대체하지 않고 데모와 감사 검증을 위한 표현 계층을 추가한다.

단계: **Observe** → **Agent** → **Policy** → **Execution** → **On-chain** → **Reconciliation**

- 각 단계는 완료·진행·차단·누락 상태를 구분하고 timestamp를 표시한다.
- 단계 간 연결이 끊기거나 hash가 불일치하면 상단에 integrity warning을 표시한다.
- 민감정보, 전체 prompt, KMS signature raw bytes는 표시하지 않는다.

### 확장 도메인 타입

```typescript
type DataMode = "fixture" | "live";
type Network = "devnet" | "mainnet-beta";
type ProofState = "pending" | "complete" | "incomplete" | "invalid";

interface DemoProof {
  proposalId: string;
  attemptId: string | null;
  dataMode: DataMode;
  network: Network;
  agentRunIds: string[];
  policyVersion: string;
  simulation?: { ok: boolean; slot?: number; unitsConsumed?: number };
  kms?: { keyVersion: string; messageHash: string; requested: boolean };
  transaction?: { signature: string; slot: number; commitment: string; explorerUrl: string };
  reconciliation?: { matched: boolean; beforeRef: string; afterRef: string };
  proofState: ProofState;
  integrityWarnings: string[];
}
```

## 30. Agent Run Drawer

- **Market Context**: 관찰 사실, 이상 징후, 데이터 품질, evidence refs
- **Treasury Strategy**: NO_ACTION 또는 SWAP, 방향, 금액, 근거, confidence, expiresAt
- **Risk Review**: approve/revise/reject, 근거 충돌, 행동하지 않을 이유
- **공통 메타데이터**: model, modelVersion, promptVersion, schemaVersion, latency, validation result

AI 결과와 Policy Decision을 같은 색상이나 동일 배지로 표현하지 않는다.

## 31. 3분 데모 화면 계약

| 시간 | 장면 | 필수 표시 | 심사 기준 |
|---|---|---|---|
| 00:00-00:40 | Observe + Agent | live 배지, 잔고·가격·근거·만료 | AI 활용도 |
| 00:40-01:30 | Policy | AUTO와 RuleCheck actual/expected | 혁신성·UX |
| 01:30-02:20 | Execution | simulation, KMS, signature, Explorer, 전후 잔고 | 기술 완성도·실제 구동 |
| 02:20-03:00 | BLOCK | 위반 규칙, kmsRequested=false, 실행 미호출 | 안전 통제 |

## 32. 오해 방지 표시 규칙

- 상단 App Shell에 LIVE/FIXTURE와 DEVNET/MAINNET 배지를 항상 표시한다.
- fixture 데이터에는 Explorer 링크나 실제 KMS 서명 표현을 사용하지 않는다.
- proofComplete=false이면 Success 대신 "Evidence incomplete"를 표시한다.
- BLOCK은 실패가 아니라 정책이 의도대로 작동한 안전 결과로 설명하되 violation을 숨기지 않는다.

## 33. 백엔드 팀과 먼저 확정할 계약 (체크리스트)

- [ ] Proposal JSON schema
- [ ] Proposal status 전이 목록
- [ ] 정책 rule code 목록
- [ ] error code 목록
- [ ] SSE event schema
- [ ] amount atomic/display 변환 책임
- [ ] transaction Explorer URL 생성 책임
- [ ] Mock와 LIVE 환경 구분 방식

## 34. 공식 참고자료

- Next.js App Router: https://nextjs.org/docs/app
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview
- Zod: https://zod.dev/
- Google Cloud Run: https://cloud.google.com/run/docs
- Vertex AI function calling: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling
- Solana transactions: https://solana.com/docs/core/transactions
- Solana Explorer: https://explorer.solana.com/
- Jupiter developer documentation: https://developers.jup.ag/
