# CofferGate Frontend

CofferGate Frontend는 AI가 생성한 자산 운용 제안과 정책 판단, 실행 증거를 확인하는 운영 콘솔입니다. 프론트엔드는 정책 판정이나 거래 서명을 직접 수행하지 않으며, CofferGate Devnet 백엔드가 제공하는 결과를 서버에서 조회하고 Zod 계약 검증을 거쳐 화면에 표시합니다.

## 주요 기능

- 운영 대시보드
- 제안 목록 및 상세
- 정책 판단과 규칙 확인
- 활동 기록과 실행 증거 확인
- 운영 정책 및 시스템 상태
- AUTO와 BLOCK 데모 시나리오

P0 조회 API 5개가 실제 Devnet 백엔드에 연결되어 있습니다.

- `GET /api/v1/dashboard`
- `GET /api/v1/proposals`
- `GET /api/v1/proposals/{proposalId}`
- `GET /api/v1/policy/current`
- `GET /api/v1/system/readiness`

브라우저에서 백엔드를 직접 호출하지 않습니다. 데이터 흐름은 다음과 같습니다.

```text
Browser
→ Next.js Server Component / Server Action
→ Real DataProvider
→ Cloud Run IAM
→ CofferGate Backend
→ Zod 검증
→ UI
```

## 실행 방법

```bash
git clone https://github.com/CofferGate/CofferGate_frontend.git
cd CofferGate_frontend
npm install -g npm@10.9.2
npm ci
```

로컬 실행 전에 `.env.local`에 Devnet 백엔드 URL을 설정합니다.

```bash
COFFERGATE_BACKEND_URL=https://<coffergate-backend-service-url>
```

이 값은 공개 클라이언트 환경변수가 아닙니다. Next.js 서버가 요청 시 Google Cloud ID token을 발급받아 Cloud Run IAM으로 보호된 백엔드를 호출합니다. 로컬 환경에서는 백엔드 호출 권한이 있는 Google Application Default Credentials가 필요합니다. 인증 토큰이나 서비스 계정 키는 저장소에 저장하지 않습니다.

```bash
npm run dev
```

실행 후 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

권장 환경:

- Node.js 20 LTS
- npm 10.9.2

## 데모 확인

1. 첫 화면에서 **데모 보기**를 선택합니다.
2. 정상 자동 실행 시나리오를 확인합니다.
3. 정책 차단 시나리오를 확인합니다.
4. 제안 상세에서 정책 규칙과 실행·정산 증거를 확인합니다.

정상 실행 흐름은 Simulation 성공, Cloud KMS 서명, Solana Devnet transaction 제출, confirmation, reconciliation을 거쳐 `RECONCILED` 상태로 완료됩니다. 데모는 실제 금융자산이나 Solana Mainnet을 사용하지 않으며, 고정된 Solana Devnet 데모 토큰만 사용합니다.

## 화면 구성

| 경로 | 화면 |
| --- | --- |
| `/` | 랜딩 |
| `/dashboard` | 운영 대시보드 |
| `/proposals` | 제안 목록 |
| `/proposals/[proposalId]` | 제안 상세 |
| `/activity` | 활동 기록 |
| `/policy` | 운영 정책 |
| `/system` | 시스템 상태 |
| `/demo` | 데모 |

## 기술 스택

Next.js 15.5.22, React 19.2.8, React DOM 19.2.8, TypeScript, Tailwind CSS, Zod, Pretendard, Tabler Icons

## 프로젝트 구조

- `src/app`: App Router 페이지와 Server Action
- `src/components`: 공통 UI 컴포넌트
- `src/lib/data`: Real DataProvider, 백엔드 IAM 호출, 응답 검증
- `src/lib/domain`: API 및 도메인 Zod 계약
- `fixtures`: 계약 테스트와 개발 검증용 fixture
- `tests`: P0 응답 및 실행 계약 테스트

## 현재 구현 범위

현재 런타임 데이터 소스는 Real DataProvider입니다. Dashboard, Proposal 목록·상세, Policy, System 조회는 Cloud Run의 CofferGate Devnet 백엔드와 연동됩니다. 프론트 런타임 서비스 계정이 백엔드 `roles/run.invoker` 권한으로 인증하며, 응답은 공통 envelope와 도메인 Zod schema로 검증됩니다.

실행 증거에는 Simulation 결과, Cloud KMS 서명 정보, Devnet transaction signature, confirmation 및 reconciliation 상태가 포함됩니다. `RECONCILED` 완료 상태와 Solana Explorer Devnet 링크를 통해 실행 결과를 확인할 수 있습니다.

TypeScript 검사는 다음 명령으로 실행합니다.

```bash
npx tsc --noEmit
```
