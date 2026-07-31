# CofferGate Frontend

CofferGate Frontend는 AI가 생성한 자산 운용 제안을 정책에 따라 AUTO, ESCALATE, BLOCK으로 판정하고 실행 과정을 확인하는 운영 콘솔입니다. 프론트엔드는 정책 판정이나 거래 서명을 직접 수행하지 않으며, 백엔드가 제공한 결과와 증거를 화면에 표시합니다. 현재 저장소는 해커톤 심사를 위해 Mock fixture 기반으로 실행할 수 있습니다.

## 주요 기능

- 운영 대시보드
- 제안 목록 및 상세
- 정책 판정과 규칙 확인
- 활동 기록
- 운영 정책 및 시스템 상태
- AUTO와 BLOCK 데모 시나리오

## 실행 방법

```bash
git clone https://github.com/CofferGate/CofferGate_frontend.git
cd CofferGate_frontend
npm install -g npm@10.9.2
npm ci
npm run dev
```

실행 후 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

권장 환경:

- Node.js 20 LTS
- npm 10.9.2

현재 Mock 버전은 별도 환경변수 없이 실행할 수 있습니다.

## 데모 확인

1. 홈 화면에서 **데모 보기**를 선택합니다.
2. 정상 자동 실행 시나리오를 확인합니다.
3. 정책 차단 시나리오를 확인합니다.
4. 제안 상세에서 정책 규칙과 실행·정산 과정을 확인합니다.

현재 데모는 Mock fixture 기반이며 실제 자산 이동, KMS 서명, Solana 거래 제출을 수행하지 않습니다. 화면의 Mock 거래 식별자는 실제 transaction signature가 아닙니다.

## 화면 구성

| 경로 | 화면 |
| --- | --- |
| `/` | 홈 |
| `/dashboard` | 운영 대시보드 |
| `/proposals` | 제안 목록 |
| `/proposals/[proposalId]` | 제안 상세 |
| `/activity` | 활동 기록 |
| `/policy` | 운영 정책 |
| `/system` | 시스템 상태 |
| `/demo` | 데모 |

## 기술 스택

Next.js 14, React 18, TypeScript, Tailwind CSS, Zod, Pretendard, Tabler Icons

## 프로젝트 구조

- `src/app`: 페이지와 라우트
- `src/components`: 공통 UI 컴포넌트
- `src/lib`: 도메인 타입, 데이터 provider, 권한 로직
- `fixtures`: Mock 제안, 정책, 시스템 상태 데이터

## 현재 구현 범위

현재 버전은 Mock 데이터로 조회 화면과 데모 흐름을 재현합니다. 실제 인증, LIVE API, 평가 요청, 승인·거절 처리, SSE, KMS 및 Solana 실행은 백엔드 연동 대상입니다.

TypeScript 검사는 다음 명령으로 실행합니다.

```bash
npx tsc --noEmit
```
