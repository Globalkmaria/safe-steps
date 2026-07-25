# Cross Safe — 베이스 스캐폴드 실행 계획 (2026-07-25, rev.3 — FSD + audit 선제 대응 + 모바일 인터랙션 기반)

**목표**: 12시간 POC의 기반이 될 Next.js 스캐폴드를 **약 120분** 안에 완성한다.
게임 자체의 설계는 별도 스펙으로 미룬다 — 이 문서는 게임이 나중에 꽂힐 **자리(seam)** 만 만든다.
구조는 **Feature-Sliced Design(FSD) v2.1**을 따르되 최소 레이어(`pages` + `shared`, 라우터 겸 `app`)로 시작하고, 이 리포에서 나중에 돌릴 `audit` 스킬의 체크리스트(접근성·타입·클린코드·성능·보안)를 스캐폴드 단계에서 **선제 충족**한다. rev.3 추가분: 전앱 세로 화면 안내(**OrientationPrompt**, rev.2의 OrientationGate 대체)와 햅틱·오디오·음성·틸트를 게임 코드로부터 격리하는 **capability 레이어**(Phase 10).

**확정 사항 (재론 금지)**
- UI: Tailwind CSS v4 + shadcn/ui (컴포넌트를 로컬로 복사해 소유, `src/shared/ui/`에 설치)
- i18n: 라이브러리 없음. 영어 문자열을 JSX에 하드코딩 (나중에 다국어가 필요해지면 전체 문자열 추출 작업이 한 번 발생하는 비용을 감수하는 선택)
- 백엔드/영속화: 없음. `src/shared/api/` 단일 경계 뒤에 `localStorage`로 격리
- 모바일: 모바일 퍼스트 반응형. 세로 뷰포트(높이>너비)에서는 **전 기기 공통** 전면 회전 안내(OrientationPrompt) — 닫기 버튼 없음, 가로가 되는 순간 스스로 사라짐. 햅틱·오디오·음성(TTS)·틸트는 `src/shared/lib`의 capability 모듈 뒤로 격리하고 전부 progressive enhancement로 취급. PWA/오프라인 없음
- 구조: FSD v2.1, 최소 레이어. 게임의 자리는 `src/pages/game/` 슬라이스
- 배포: Vercel

**작업 이름/브랜딩(작업용)**: 앱 이름 **Cross Safe**, 태그라인 *"Learn to cross the road safely"*. UI 문자열은 전부 영어.

**검증된 도구 버전** (2026-07-25 기준, 공식 문서·npm 레지스트리로 확인):
Next.js 16.2.x (Turbopack 기본, `next build`는 더 이상 lint를 자동 실행하지 않음), Tailwind v4 (create-next-app 기본 포함), shadcn CLI 최신, Steiger 0.6.0 (`steiger` 패키지 — 주의: `@feature-sliced/steiger`라는 패키지는 npm에 존재하지 않음, 404 확인), Node v22.17.0 / npm 11.14.1 (로컬 확인).

**Web API 지원 현황** (2026-07-25 확인): `screen.orientation.lock()`은 iOS Safari 미지원 — Safari 16.4가 `type`/`angle`/`onchange`만 추가하고 `lock()`은 제외했으므로 **회전 안내 UI가 유일한 이식 가능 수단**이다. Vibration API(`navigator.vibrate`)는 iOS Safari 전 버전 미지원(Android Chrome 지원). `speechSynthesis`는 모든 모던 브라우저 지원 — 단 iOS는 **첫 `speak()`가 사용자 제스처 핸들러 안**이어야 하며(밖이면 조용히 무시), 첫 제스처 이후 해제된다. iOS 오디오는 사용자 제스처 안에서 `AudioContext.resume()`을 호출해야 잠금 해제된다.

---

## 페이즈 요약 (총 ~120분)

| # | 페이즈 | 예상 |
|---|---|---|
| 0 | 사전 점검 | 3분 |
| 1 | 프로젝트 생성 (create-next-app) | 8분 |
| 2 | 패키지 매니저 격리 + workspace root 고정 | 10분 |
| 3 | tsconfig — src 별칭 + 강화 | 5분 |
| 4 | FSD 디렉터리 구조 생성 | 5분 |
| 5 | shadcn/ui → `src/shared/ui` 설치 | 12분 |
| 6 | 전역 스타일·토큰(대비 측정)·폰트·모바일 CSS | 10분 |
| 7 | 앱 셸 + FSD pages 슬라이스 | 19분 |
| 8 | OrientationPrompt (전앱 세로 화면 안내) | 9분 |
| 9 | 영속화 경계 `src/shared/api` | 7분 |
| 10 | Capability 레이어 (haptics·audio·speech·motion) | 12분 |
| 11 | Lint/Format + 타입 규칙 + Steiger | 8분 |
| 12 | Git 첫 커밋 | 3분 |
| 13 | Vercel 배포 | 9분 |

rev.2(105분) 대비 +15분: OrientationPrompt 전환 + 랜딩 CTA 클라이언트화(+3), capability 레이어 4모듈(+12). 12시간 예산에서 여전히 한 조각이다.

---

## Phase 0 — 사전 점검 (3분)

```bash
cd /Users/mariakim/Desktop/builder/cross
node -v          # v22.17.0
npm -v           # 11.14.1
cat /Users/mariakim/package.json
ls -a /Users/mariakim | grep -E 'yarn|lock'
```

**성공 확인**: 상위 디렉터리 `/Users/mariakim`에 `package.json`(`"packageManager": "yarn@1.22.22..."`), `package-lock.json`, `.yarnrc`, `.yarnrc.yml`, `.yarn`이 존재함을 눈으로 확인한다. 이것이 Phase 2에서 격리해야 할 대상이다. (2026-07-25 실측: 전부 존재함.)

---

## Phase 1 — 프로젝트 생성 (8분)

`create-next-app`은 대상 디렉터리에 화이트리스트(`docs`, `.git` 등) 밖의 항목이 있으면 "could conflict" 에러로 거부한다. 현재 `cross/`에는 `.claude/`(화이트리스트 아님)와 `docs/`가 있으므로, **안전하게 둘 다 잠시 옆으로 옮겼다가 복원**한다.

```bash
cd /Users/mariakim/Desktop/builder/cross
mv .claude ../cross-keep-claude
mv docs ../cross-keep-docs

npx create-next-app@latest . \
  --ts --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*" \
  --turbopack --no-react-compiler \
  --use-npm --skip-install \
  --reset-preferences --yes

mv ../cross-keep-claude .claude
mv ../cross-keep-docs docs
```

플래그 근거 (Next 16.2 공식 CLI 레퍼런스에서 확인):
- `--no-src-dir`: **의도적 선택.** Next 라우터는 루트 `app/`에 남기고(= FSD app 레이어 겸용, Phase 4 참고), FSD 레이어용 `src/`는 Phase 4에서 수동 생성한다. `--src-dir`로 만들면 라우터가 `src/app/`으로 들어가 FSD `src/pages`·`src/shared`와 뒤섞인다.
- `--skip-install`: 의존성 설치 **전에** Phase 2의 packageManager 필드를 먼저 심기 위해
- `--use-npm` + `--reset-preferences` + `--yes`: 저장된 선호 설정·프롬프트 개입 없이 결정적으로 실행
- `--no-react-compiler`: POC에서 검증 안 된 변수 하나 제거
- git init은 create-next-app이 기본으로 해준다 (상위에 `.git` 없음 → 여기가 리포 루트가 됨)

**성공 확인**:
```bash
ls   # app/ public/ package.json tsconfig.json next.config.ts eslint.config.mjs .gitignore docs/ .claude/ ...
git rev-parse --show-toplevel   # → /Users/mariakim/Desktop/builder/cross
```
`app/`, `package.json`, `.git/`이 생겼고 `.claude/`와 `docs/`가 제자리에 복원됐으면 성공.

---

## Phase 2 — 패키지 매니저 격리 + workspace root 고정 (10분) ★ 함정 구간

### 왜 문제가 되나 (메커니즘)

1. **Corepack의 상향 탐색**: Corepack(로컬에 v0.33.0 존재)은 cwd에서 디렉터리를 **위로 올라가며** `packageManager` 필드가 있는 **첫 번째** `package.json`을 찾는다. 필드가 없는 `package.json`은 건너뛰고 계속 올라간다. 우리 프로젝트에 필드가 없으면 `/Users/mariakim/package.json`의 `yarn@1.22.22`에 도달해 yarn을 강제한다.
2. **Next/Turbopack의 workspace root 추론**: Next는 상위 디렉터리의 lockfile들을 보고 모노레포 루트를 추론한다. `/Users/mariakim`에 `package-lock.json`이 실제로 존재하므로 "inferred your workspace root" 경고와 함께 잘못된 루트를 잡을 수 있다.

### 조치

**(a)** 프로젝트 자체 `package.json`에 `packageManager`를 심는다 — Corepack의 상향 탐색이 우리 프로젝트에서 **멈추게** 하는 유일하고 충분한 조치:

```bash
npm pkg set packageManager=npm@11.14.1
npm install
```

**(b)** `next.config.ts`를 다음으로 교체 — Turbopack 루트와 파일 트레이싱 루트를 프로젝트에 고정:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
```

**(c)** 팀 규칙: 이 프로젝트에서는 **npm만** 사용한다. `yarn`/`pnpm` 명령 금지.

### 격리 검증 (가정하지 말고 확인)

```bash
npm pkg get packageManager        # → "npm@11.14.1"
ls package-lock.json              # 존재해야 함
ls yarn.lock 2>&1                 # "No such file" 이어야 함
corepack yarn --version 2>&1      # "This project is configured to use npm" 류의 에러 → 격리 성공의 직접 증거
npm run dev                       # 기동 로그에 "inferred your workspace root" 경고가 없어야 함 → Ctrl+C
```

`corepack yarn --version`이 npm을 언급하며 **거부**하면, Corepack이 상위 yarn 설정 대신 우리 필드를 읽고 있다는 뜻이다. 넷 다 통과하면 격리 완료.

---

## Phase 3 — tsconfig: src 별칭 + 강화 (5분)

`tsconfig.json`의 `compilerOptions`에서 두 가지를 바꾼다.

**(a) 경로 별칭을 `src/`로**. 스캐폴드 기본값 `"@/*": ["./*"]`를 다음으로 교체 — 별칭 하나로 모든 FSD 레이어를 가리킨다 (`@/pages/game`, `@/shared/ui/button`). FSD 레퍼런스는 레이어별 별칭 6개를 예시하지만, 단일 `@/*`로도 동일하게 동작하고 설정이 짧다:

```json
"paths": { "@/*": ["./src/*"] }
```

루트 `app/`(라우터)은 별칭 대상이 아니다 — **아무도 라우트 파일을 import하지 않는 것이 FSD 방향상 올바르다** (라우트가 `@/pages/*`를 가져오는 단방향).

**(b) 인덱스 접근 안전성** 추가 — 게임 상태(레벨 배열, 별점 맵) 인덱스 접근 버그를 컴파일 타임에 잡기 위해:

```json
"noUncheckedIndexedAccess": true
```

`strict: true`는 스캐폴드가 이미 켠다.

**성공 확인**:
```bash
npx tsc --noEmit   # 에러 0개로 종료 (이 시점엔 @ import가 아직 없어 통과)
```

---

## Phase 4 — FSD 디렉터리 구조 생성 (5분)

### 레이어 판단 (FSD v2.1 원칙 그대로)

- **최소 레이어로 시작한다**: `pages` + `shared` (+ 라우터 겸 `app`). FSD v2.1의 자체 규칙대로 **`widgets/`·`features/`·`entities/`는 빈 폴더로 만들어두지 않는다** — 2곳 이상에서 재사용이 확인되고 팀이 동의할 때 그때 만든다.
- **게임의 자리는 `src/views/game/` 슬라이스다** (rev.1의 `features/game/`을 대체). 게임의 UI·상태·로직·데이터가 이 슬라이스의 `ui/`·`model/` 세그먼트로 통째로 들어온다. FSD v2.1에서 pages는 얇은 래퍼가 아니라 **로직을 소유하는 레이어**이므로, 게임 전체가 한 슬라이스에 사는 것이 규칙에 부합한다.

> ### ⚠️ 실행 중 발견 — FSD `pages` 레이어는 `views` 로 개명해야 한다
>
> rev.3까지 이 문서는 FSD pages 레이어를 `src/pages/` 에 두라고 했다. **실제로 만들어보니 동작하지 않는다.**
> `src/pages/` 는 Next.js 의 **Pages Router 예약 경로**다. 루트 `app/` 과 함께 존재하면 Next 가 기동 중 다음으로 죽는다:
>
> ```
> Error: > `pages` and `app` directories should be under the same folder
> ```
>
> FSD 공식 프레임워크 통합 가이드의 Next.js 예시가 `src/pages/` 를 제시하지만, App Router 프로젝트에서는 그대로 쓸 수 없다.
> 해법은 FSD 커뮤니티의 표준 우회다 — **pages 레이어를 `views` 로 개명한다.** 레이어의 의미·위치·import 방향 규칙은 그대로이고, 폴더 이름만 프레임워크 예약어를 피한다.
> 이 문서의 나머지에 나오는 `src/pages/` 는 전부 `src/views/` 로 읽는다. import 별칭도 `@/views/*` 다.

### 의도적 이탈 1건 (기록)

FSD 프레임워크 통합 가이드는 `src/app/`(FSD app 레이어)을 별도로 두라고 하지만, **이 프로젝트는 Next 루트 `app/` 디렉터리가 FSD app 레이어를 겸한다**. 이유:

1. Next 16.2 공식 문서 확인 결과: *"`src/app` or `src/pages` will be ignored if `app` or `pages` are present in the root directory."* — 루트 `app/`이 있는 한 `src/app/`은 라우터로서 **조용히 무시**된다. 둘을 공존시키면 죽은 디렉터리를 편집하는 사고를 초대한다.
2. Next의 루트 `app/`이 하는 일(앱 초기화, 라우팅, 전역 스타일, 에러 바운더리)이 곧 FSD app 레이어의 역할이다 — 같은 책임을 두 폴더에 쪼갤 이유가 없다.
3. POC에는 분리해서 얻을 provider 계층이 아직 없다.

import 방향 규칙은 그대로 유지된다: 루트 `app/` → `@/pages/*`·`@/shared/*`만 import, 역방향 금지. provider가 여럿 생기는 날 `src/app/providers/`를 만들어 옮기면 된다(그때도 라우터는 루트 `app/`에 남는다).

### 생성

```bash
mkdir -p src/pages/home/ui src/pages/game/ui \
         src/shared/ui src/shared/lib src/shared/api src/shared/config
```

빈 폴더 금지 원칙에 따라 위 폴더는 전부 Phase 5~10에서 파일을 받는다. `src/shared/config`는 지금 바로 채운다 — 매직 넘버/문자열의 집(클린코드 규칙):

```ts
// src/shared/config/site.ts
export const SITE_NAME = "Cross Safe";
export const SITE_TAGLINE = "Learn to cross the road safely";
export const ROUTES = { home: "/", game: "/game" } as const;
```

### 최종 구조와 각 위치의 존재 이유

```
cross/
├─ app/                       # Next 라우터 = FSD app 레이어 (위 이탈 기록 참조)
│  ├─ layout.tsx              #   전역 metadata + viewport + 폰트 + OrientationPrompt 배선
│  ├─ page.tsx                #   얇은 라우트 → <HomePage />
│  ├─ game/page.tsx           #   얇은 라우트 → <GamePage />
│  ├─ error.tsx / not-found.tsx / loading.tsx   # 라우터 파일 컨벤션(여기 있어야 동작)
│  ├─ icon.svg / opengraph-image.tsx
│  └─ globals.css
├─ src/
│  ├─ pages/                  # FSD pages 레이어 — 화면과 그 로직의 주인
│  │  ├─ home/
│  │  │  ├─ ui/HomePage.tsx
│  │  │  ├─ ui/StartLearningButton.tsx  # CTA + iOS 오디오 unlock 게이트 ('use client')
│  │  │  └─ index.ts          #   슬라이스 public API (규칙 4-2)
│  │  └─ game/                # ★ 게임이 통째로 들어올 자리 (ui/ + 스펙 후 model/)
│  │     ├─ ui/GamePage.tsx   #   지금은 stub
│  │     └─ index.ts
│  └─ shared/                 # 비즈니스 로직 없는 인프라 (규칙 4-5)
│     ├─ ui/                  #   shadcn UI 킷 + OrientationPrompt
│     ├─ lib/                 #   cn.ts, use-media-query.ts, haptics/audio/speech/motion.ts (Phase 10)
│     ├─ api/                 #   영속화 경계 — localStorage는 여기서만
│     └─ config/              #   site.ts, feedback.ts — 상수(매직 넘버 금지의 집)
├─ public/                    # 정적 에셋
└─ docs/plans/                # 계획 문서 (이 문서 포함)
```

**성공 확인**: `ls -R src`가 위 구조를 보여주고, `src/shared/config/site.ts`가 존재한다.

---

## Phase 5 — shadcn/ui → `src/shared/ui` 설치 (12분)

shadcn init이 `globals.css`를 재작성하므로 **커스텀 스타일(Phase 6)보다 먼저** 실행한다. 순서가 중요하다: init → 별칭 수정 → cn 이동 → add.

### (a) init

```bash
npx shadcn@latest init
# 프롬프트가 나오면 전부 기본값(Enter). Tailwind v4를 자동 감지해 CSS 변수 기반으로 설정한다.
```

이 시점 결과물: `components.json`(기본 별칭 `@/components`, `@/lib/utils`), cn 유틸(`@/lib/utils` → tsconfig 별칭 때문에 `src/lib/utils.ts`에 생성), 재작성된 `app/globals.css`.

### (b) 별칭을 FSD 경로로 수정

`components.json`의 `aliases`를 다음으로 교체 (components.json 공식 문서 확인: 별칭 키는 `components`/`ui`/`lib`/`hooks`/`utils`이고 커스텀 경로 허용, tsconfig paths가 실제 해석을 담당):

```json
"aliases": {
  "components": "@/shared/ui",
  "ui": "@/shared/ui",
  "lib": "@/shared/lib",
  "hooks": "@/shared/lib",
  "utils": "@/shared/lib/cn"
}
```

### (c) cn을 FSD 규칙에 맞게 이동

`utils.ts`는 기술 역할 파일명이라 FSD 규칙 4-4 위반 → 도메인 이름 `cn.ts`로:

```bash
mv src/lib/utils.ts src/shared/lib/cn.ts
rmdir src/lib
```

### (d) 컴포넌트 추가

```bash
npx shadcn@latest add button card dialog badge progress
```

지금 5개의 근거: **button/card**(모든 화면), **dialog**(게임 결과·안내 팝업 — Radix 기반이라 `role="dialog"`·포커스 트랩·ESC 닫기가 공짜, audit 접근성 AA 모달 항목 선제 충족), **badge**(점수/상태), **progress**(학습 진행도). 나머지는 게임 스펙 후 CLI 한 줄로 추가.

**성공 확인 + 실패 시 대처**:
```bash
ls src/shared/ui               # button.tsx card.tsx dialog.tsx badge.tsx progress.tsx
head -5 src/shared/ui/button.tsx   # import { cn } from "@/shared/lib/cn" 이어야 함
```
컴포넌트가 `src/components/`에 생겼거나 import가 `@/lib/utils`를 가리키면 → (b)의 별칭 철자를 확인·수정 후 `npx shadcn@latest add button card dialog badge progress --overwrite` 재실행.

### (e) 터치 타깃 보정 — WCAG 2.5.8 (우리가 코드를 소유하므로 직접 수정)

`src/shared/ui/button.tsx`의 size variants에서 주 액션 44px을 보장한다 (WCAG 2.5.8 최소 기준은 24px, 아이 대상 서비스이므로 권장 44px 채택):

```
default: h-9  → h-11    (44px)
sm:      h-8  → h-10    (40px, 보조 액션 한정)
lg:      h-10 → h-12
icon:    size-9 → size-11
```

**이때 `focus-visible:` 계열 클래스는 절대 건드리지 않는다** — shadcn 버튼의 포커스 링이 audit 접근성 AA(2.4.7 포커스 표시)를 충족하는 근거다. size 문자열의 `h-*`/`size-*`만 바꾼다.

**성공 확인**: `npx tsc --noEmit` 통과. dev 서버에서 버튼 렌더 후 DevTools로 높이 44px 확인, Tab 키로 포커스 링이 보이는지 확인.

---

## Phase 6 — 전역 스타일·토큰·폰트·모바일 CSS (10분)

### 폰트 — next/font

아이 대상 서비스이므로 둥근 인상의 **Nunito**를 쓴다. `app/layout.tsx`에서 스캐폴드의 Geist import를 다음으로 교체:

```tsx
import { Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});
```

`<body>`는:

```tsx
<body className={`${nunito.variable} font-sans antialiased`}>
```

### globals.css

shadcn init이 만든 `app/globals.css`를 기준으로:

1. `@theme inline` 블록에서 폰트 매핑을 교체 (Geist 관련 라인 삭제):

```css
--font-sans: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
```

2. `:root` 디자인 토큰 조정 — **프라이머리는 대비를 측정하고 골랐다.** 처음 후보였던 `oklch(0.65 0.17 150)`(#1eab53)은 흰 텍스트 대비 **3.01:1로 WCAG AA(4.5:1) 미달** — 버튼 라벨에 쓰면 audit 접근성 레인에서 바로 걸린다. 채택값은 Tailwind green-700과 동일한 값:

```css
--primary: oklch(0.527 0.154 150.069);   /* = #008236, 흰 텍스트 대비 4.94:1 (측정값) */
--primary-foreground: oklch(1 0 0);      /* 흰색 */
--ring: oklch(0.527 0.154 150.069);      /* 포커스 링도 브랜드 그린 */
--radius: 0.75rem;                       /* 아이 친화적 라운딩 */
```

측정 방법: OKLCH→sRGB 변환 후 WCAG 상대 휘도 공식으로 계산 (2026-07-25, #008236 vs #ffffff = **4.94:1**). 실행 단계 검증은 아래 성공 확인 참조.

3. 스캐폴드가 남긴 `@media (prefers-color-scheme: dark)` 블록이 있으면 **삭제** — 라이트 모드로 고정한다 (다크 대응은 POC 범위 외, shadcn의 `.dark` 클래스는 붙이지 않으므로 비활성).

4. 파일 하단에 **모바일 + 모션 기반 블록** 추가:

```css
/* --- Mobile foundation --- */

html {
  /* iOS 가로 회전 시 폰트 자동 확대 방지 */
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  /* 모바일 브라우저 주소창 개폐에도 전체 높이 유지 */
  min-height: 100dvh;
  /* pull-to-refresh 및 스크롤 체이닝 방지 (게임형 UI 전제) */
  overscroll-behavior-y: none;
}

/* 더블탭 줌 제거 + 탭 지연 제거. 핀치 줌은 접근성을 위해 살려둔다 */
a, button, [role="button"], input, label, select, textarea {
  touch-action: manipulation;
}

/* 노치/홈바 safe-area 유틸리티 (viewportFit: "cover"와 세트) */
@utility pt-safe { padding-top: env(safe-area-inset-top); }
@utility pb-safe { padding-bottom: env(safe-area-inset-bottom); }
@utility pl-safe { padding-left: env(safe-area-inset-left); }
@utility pr-safe { padding-right: env(safe-area-inset-right); }

/* --- Reduced motion — 게임은 애니메이션이 많아질 것이므로 지금 깔아둔다 --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

전체 높이 레이아웃은 앞으로 항상 `min-h-dvh`(Tailwind 내장)를 쓴다. `100vh` 금지.

**성공 확인**: `npm run dev` → 랜딩이 Nunito로 렌더된다. **대비 검증**: DevTools에서 primary 버튼의 라벨 텍스트를 inspect → Styles 패널의 color 스와치 클릭 → Contrast ratio가 **4.94** 근처(≥4.5, AA 체크 표시)임을 확인. 디바이스 모드(iPhone 프리셋)에서 세로/가로 전환 시 레이아웃 높이가 브라우저 크롬에 밀리지 않는다.

---

## Phase 7 — 앱 셸 + FSD pages 슬라이스 (19분)

**시맨틱 컨벤션 (이 페이즈부터 모든 화면에 적용)**: 페이지당 `<h1>` 정확히 1개, heading 레벨 건너뛰기 금지(h1→h2→h3), 콘텐츠는 `<main>` 랜드마크 안에. 아래 코드가 전부 이 규칙을 따른다 — 게임 화면도 이 규칙을 상속한다.

### `app/layout.tsx` — metadata + viewport

```tsx
import type { Metadata, Viewport } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cross Safe — Learn to Cross the Road Safely",
    template: "%s | Cross Safe",
  },
  description:
    "A fun, game-like way for kids to learn how to judge a safe environment for crossing the road.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // safe-area env() 값 활성화에 필요
  themeColor: "#ffffff",
};
```

(App Router의 `viewport` 객체 export는 Next 14+ 공식 API — 16.2 문서로 재확인 완료. `maximumScale`/`userScalable`로 줌을 죽이지 **않는다** — 더블탭 줌은 Phase 6의 `touch-action: manipulation`이 이미 막았고, 핀치 줌은 접근성상 유지.)

### 얇은 라우트 — 루트 `app/`은 FSD 슬라이스를 렌더만 한다

주의: 아래의 `@/pages/*`는 **FSD의 `src/pages/`** 다. Next 라우터 디렉터리가 아니다.

```tsx
// app/page.tsx
import { HomePage } from "@/pages/home";

export default function Page() {
  return <HomePage />;
}
```

```tsx
// app/game/page.tsx
import { GamePage } from "@/pages/game";

export const metadata = { title: "Game" };

export default function Page() {
  return <GamePage />;
}
```

### `src/pages/home` 슬라이스 — 랜딩

CTA는 슬라이스 내부의 클라이언트 컴포넌트다. 이유: **iOS 오디오 unlock의 "Tap to start" 게이트를 이 탭에 얹는다** — iOS는 사용자 제스처 안에서 `AudioContext.resume()`을 해야 이후 소리가 나므로, 게임 진입 탭이 자연스러운 잠금 해제 지점이다. Phase 10에서 `initAudio()` 한 줄이 여기에 배선된다. `<Link>`의 prefetch를 포기하는 대신 제스처 결합을 택했다 — 라우트 2개짜리 POC에서 옳은 교환이다. 페이지 본체는 서버 컴포넌트로 유지된다.

```tsx
// src/pages/home/ui/HomePage.tsx
import { SITE_NAME } from "@/shared/config/site";
import { StartLearningButton } from "./StartLearningButton";

export function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 pb-safe text-center">
      <span className="text-6xl" aria-hidden>🚸</span>
      <h1 className="text-4xl font-extrabold">{SITE_NAME}</h1>
      <p className="max-w-sm text-lg text-muted-foreground">
        Learn how to spot a safe place and a safe moment to cross the road.
      </p>
      <StartLearningButton />
    </main>
  );
}
```

```tsx
// src/pages/home/ui/StartLearningButton.tsx — 슬라이스 내부 부품, 'use client' 최소 범위
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/site";

export function StartLearningButton() {
  const router = useRouter();
  // Phase 10에서 onClick 앞에 `void initAudio();` 한 줄이 추가된다 (iOS 오디오 unlock)
  return (
    <Button size="lg" onClick={() => router.push(ROUTES.game)}>
      Start learning
    </Button>
  );
}
```

```ts
// src/pages/home/index.ts — 슬라이스 public API
export { HomePage } from "./ui/HomePage";
```

### `src/pages/game` 슬라이스 — 게임 자리 stub

```tsx
// src/pages/game/ui/GamePage.tsx
export function GamePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center">
      <h1 className="text-xl font-semibold">The game is on its way. Check back soon!</h1>
    </main>
  );
}
```

```ts
// src/pages/game/index.ts
export { GamePage } from "./ui/GamePage";
```

게임 스펙이 나오면: UI는 이 슬라이스의 `ui/`에, 상태·규칙·진행도는 `model/`에 추가한다(Phase 9 말미의 스케치 참조). **라우트는 이미 배선되어 있으므로 `app/`은 건드릴 일이 없다** — 이것이 seam이다.

### `app/icon.svg` — 파비콘 (Next 파일 컨벤션, 별도 등록 불필요)

브랜드 그린(#008236, Phase 6 측정값)으로 통일:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#008236"/>
  <text x="16" y="23" font-size="17" text-anchor="middle">🚸</text>
</svg>
```

### `app/opengraph-image.tsx` — OG 이미지 (코드 생성, 디자인 에셋 불필요)

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Cross Safe — Learn to cross the road safely";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#008236",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700 }}>🚸 Cross Safe</div>
        <div style={{ fontSize: 36, marginTop: 20 }}>Learn to cross the road safely</div>
      </div>
    ),
    size
  );
}
```

### `app/not-found.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-extrabold">Oops! There is no crossing here.</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Button asChild>
        <Link href="/">Back to safety</Link>
      </Button>
    </main>
  );
}
```

### `app/error.tsx` (클라이언트 컴포넌트 필수) — `role="alert"`로 스크린리더에 즉시 전달

```tsx
"use client";

import { Button } from "@/shared/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div role="alert">
        <h1 className="text-3xl font-extrabold">Something went wrong.</h1>
      </div>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
```

### `app/loading.tsx` — `role="status"`로 로딩 상태 전달

```tsx
export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <p role="status" className="animate-pulse text-lg text-muted-foreground">Loading…</p>
    </main>
  );
}
```

**성공 확인**: `npm run dev` 후 —
- `/` 랜딩과 `/game` stub이 뜬다. "Start learning" 버튼이 이동한다.
- `/nonexistent` → not-found 페이지.
- `view-source:localhost:3000`에서 `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`와 og:image 메타태그 확인.
- 탭 아이콘에 초록 파비콘.
- DevTools Elements에서 각 페이지에 `main` 1개·`h1` 1개인지 확인.

---

## Phase 8 — OrientationPrompt: 전앱 세로 화면 안내 (9분)

> **rev.2와의 차이**: rev.2의 라우트 단위 `OrientationGate`/`use-orientation.ts`는 **이 페이즈로 대체됐다 — 만들지 않는다.** 사용자 결정: 세로 뷰포트(높이>너비)에서는 기기 종류와 무관하게 전면 안내를 띄우고, 가로가 되는 순간 스스로 사라진다.

동작 규칙 (확정):
- **닫기 버튼 없음.** `matchMedia`로 반응하므로 뷰포트가 가로가 되면 즉시 스스로 사라진다 — dismiss affordance는 필요 없고, 있으면 안 된다.
- **데스크톱 포함 전 기기 적용.** 좁고 긴 브라우저 창도 안내 대상이다. 표시 여부는 `(orientation: portrait)`만 본다.
- **문구만 `(pointer: coarse)`로 분기.** 터치 기기는 "기기를 돌려라", 비터치는 "창을 넓혀라".
- **회전 잠금 안내 필수.** 닫기 버튼이 없고 `screen.orientation.lock()`은 iOS Safari 미지원이므로, 회전 잠금이 켜진 사용자에게는 잠금 해제 안내가 **유일한 출구**다.

구현 형태: 모달 오버레이가 아니라 **페이지 콘텐츠 대신 렌더**한다. DOM에 다른 콘텐츠가 없으므로 포커스 트랩·`aria-modal`·배경 스크롤 잠금이 전부 불필요해진다 — 진짜 모달보다 단순하면서 접근성 면에서 더 견고하다. 시맨틱은 `role="alertdialog"`가 아니라 **`role="alert"`**: ARIA에서 alertdialog는 포커스 가능한 컨트롤(닫기/확인)을 요구하는데 이 안내에는 상호작용 요소가 0개다. 콘텐츠를 대체하며 나타나는 assertive 라이브 리전(`role="alert"`)이 정확한 의미이고, 삽입 시점에 스크린리더가 즉시 읽는다.

### `src/shared/lib/use-media-query.ts` — 범용 훅 (orientation·pointer 둘 다 이걸로)

```tsx
"use client";

import { useCallback, useSyncExternalStore } from "react";

/** SSR에서는 null (판단 불가) — 호출부가 null을 "아직 모름"으로 처리한다. */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null // 서버 스냅샷 — hydration mismatch 방지
  );
}
```

### `src/shared/ui/OrientationPrompt.tsx`

```tsx
"use client";

import { useMediaQuery } from "@/shared/lib/use-media-query";

export function OrientationPrompt({ children }: { children: React.ReactNode }) {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isTouch = useMediaQuery("(pointer: coarse)");

  // SSR·하이드레이션 직후(null)에는 콘텐츠를 그대로 렌더 — 서버 HTML과 일치시키고,
  // 세로 기기에서는 하이드레이션 후 한 프레임 뒤 안내로 전환된다(허용된 트레이드오프).
  if (isPortrait !== true) return <>{children}</>;

  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 pb-safe text-center"
    >
      <span className="text-6xl" aria-hidden>🔄</span>
      {isTouch === true ? (
        <>
          <h1 className="text-2xl font-extrabold">Turn your device sideways!</h1>
          <p className="max-w-sm text-lg text-muted-foreground">
            Cross Safe works in the wide view. Rotate your device to landscape and
            we will jump right back in.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Screen not turning? Rotation Lock might be on. Swipe open Control
            Center (iPhone or iPad) or Quick Settings (Android), turn the lock
            off, then rotate again.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold">Make this window wider!</h1>
          <p className="max-w-sm text-lg text-muted-foreground">
            Cross Safe works in the wide view. Stretch your browser window until
            it is wider than it is tall, and we will jump right back in.
          </p>
        </>
      )}
    </div>
  );
}
```

(안내가 뜰 때 페이지의 원래 `h1`은 DOM에서 빠지므로 "페이지당 h1 1개" 규칙은 유지된다.)

### 배선 — 루트 레이아웃 (앱 전체 적용)

`app/layout.tsx`의 `<body>` 내부를 다음처럼 감싼다. 레이아웃은 서버 컴포넌트로 남고, `children`은 props로 통과하므로 서버 렌더링을 유지한다 — `'use client'` 최소 범위 규칙 그대로:

```tsx
<body className={`${nunito.variable} font-sans antialiased`}>
  <OrientationPrompt>{children}</OrientationPrompt>
</body>
```

**성공 확인**:
- 데스크톱 dev: 브라우저 창을 세로로 좁게 → "Make this window wider!" 안내, 넓히면 **버튼 조작 없이** 즉시 원래 화면 복귀.
- DevTools 디바이스 모드(iPhone 프리셋): 세로 → "Turn your device sideways!" + 회전 잠금 안내 문구, 가로 전환 → 즉시 소멸.
- `npx tsc --noEmit` 통과, dev 콘솔에 hydration 경고 없음.

---

## Phase 9 — 영속화 경계 `src/shared/api` (7분)

**원칙**: `localStorage`라는 단어는 `src/shared/api/` 밖에서 등장하면 안 된다. FSD 규칙 4-5(shared에 비즈니스 로직 금지)에 따라 **shared에는 범용 어댑터만** 둔다 — 게임 도메인 함수(`getProgress` 등)와 `PlayerProgress` 타입은 shared가 아니라 **`src/pages/game/model/`의 소유**이며, 게임 스펙이 나올 때 작성한다. 키 문자열도 소비 슬라이스가 자기 model에 상수로 정의한다(shared는 도메인 개념을 모른다).

모든 시그니처는 **async** — 나중에 DB로 바꿔도 호출부가 한 줄도 안 바뀌게 하는 핵심 장치.

### 지금 만드는 파일 (shared — 인프라만)

```ts
// src/shared/api/storage.ts — 저장 백엔드 계약. 오늘은 localStorage, 내일은 DB/API.
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
```

```ts
// src/shared/api/local-storage.ts — StorageAdapter의 오늘자 구현 (~25줄)
// 구현 시 요구사항 3가지:
//  1. SSR 가드: typeof window === "undefined" 이면 get→null, set/remove→no-op
//  2. JSON.parse 실패 시 throw 하지 말고 null 반환 (손상 데이터로 앱이 죽지 않게)
//  3. 역직렬화 반환값의 `as T` 단언은 허용 — 신뢰 경계의 캐스트이며 주석으로 표시
//     (이 파일 밖에서의 `as` 단언은 금지 — 컨벤션 섹션 참조)
export const localStorageAdapter: StorageAdapter = /* 구현 */;
```

```ts
// src/shared/api/index.ts — public API
export type { StorageAdapter } from "./storage";
export { localStorageAdapter } from "./local-storage";
```

(파일명이 `types.ts`/`utils.ts`가 아닌 것은 FSD 규칙 4-4 — 기술 역할명 금지.)

### 게임 스펙 때 작성할 것 (미리 만들지 않는다 — 스케치만)

아래는 **시그니처 명세**이므로 그대로 붙여넣지 말 것 — 본문 없는 `export async function f(): Promise<T>;`는 `.ts` 파일에서 컴파일되지 않는다. 아래 시그니처를 지키되 본문을 채워 작성한다.

```ts
// src/pages/game/model/progress.ts — 게임 도메인 소유 (스펙 확정 후 작성)
import { localStorageAdapter } from "@/shared/api";

const PROGRESS_KEY = "player-progress";   // 키는 이 슬라이스의 소유

export interface PlayerProgress {
  completedLevels: string[];
  stars: Record<string, number>;
  updatedAt: string; // ISO 8601
}

export async function getProgress(): Promise<PlayerProgress | null>;
export async function saveProgress(progress: PlayerProgress): Promise<void>;
export async function resetProgress(): Promise<void>;
```

### 교체 시나리오 (swap-later story)

DB가 생기는 날: `src/shared/api/remote-storage.ts`를 새로 쓰고 `index.ts`의 export 한 줄을 바꾼다. 시그니처가 이미 async이므로 게임 model을 포함한 모든 호출부는 **무변경**. 마이그레이션(로컬→서버 병합)도 이 경계 내부의 관심사다.

**성공 확인**: 세 파일 작성 후 `npx tsc --noEmit` 통과. 그리고:
```bash
grep -rn "localStorage" app src --include="*.ts" --include="*.tsx"
# → src/shared/api/local-storage.ts 단 1개 파일에서만 검출되어야 함
```

---

## Phase 10 — Capability 레이어: haptics·audio·speech·motion (12분)

**목적: 게임 코드에 플랫폼 분기가 단 한 줄도 들어가지 않게 한다.** 네 개의 얇은 모듈이 각자 feature-detect하고, 미지원 환경에서는 **조용히 no-op**으로 강등된다. 전부 `src/shared/lib/`(비즈니스 로직 없는 인프라 — FSD 규칙 4-5). "어떤 순간에 어떤 햅틱/음성을 쓸지"는 게임 슬라이스의 도메인 결정이고, 여기는 수단만 제공한다.

이 모듈들은 컴포넌트/훅이 아닌 일반 함수라 `'use client'` 지시어가 필요 없다 — 각자 SSR 가드(`typeof window`/`navigator` 확인)를 갖고, 클라이언트 컴포넌트의 핸들러에서 호출된다.

### 상수 먼저 — `src/shared/config/feedback.ts` (매직 넘버 금지)

```ts
// 진동 패턴: 게임은 의미(성공/실패/틱)로 말하고, 밀리초는 여기에만 산다
export const HAPTIC_PATTERNS = {
  success: [30],
  error: [60, 40, 60],
  tick: [10],
} as const;
export type HapticKind = keyof typeof HAPTIC_PATTERNS;

// TTS: 아이가 따라오기 쉬운 약간 느린 속도, 제품 언어는 영어 고정
export const SPEECH_RATE = 0.9;
export const SPEECH_LANG = "en-US";
```

### `src/shared/lib/haptics.ts` — Android 한정 progressive enhancement

iOS Safari는 Vibration API를 지원하지 않는다(전 버전). iOS 폴리필(`ios-vibrator-pro-max`류)은 **쓰지 않는다** — "명시적으로 하지 않는 것" 참조.

```ts
import { HAPTIC_PATTERNS, type HapticKind } from "@/shared/config/feedback";

/** 미지원(iOS 등)이면 조용히 no-op. Chrome은 프레임이 사용자 탭을 받기 전의
 *  호출을 차단하고 콘솔 경고만 남긴다 — 게임 내 호출은 항상 상호작용 이후라 무해. */
export function vibrate(kind: HapticKind): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate([...HAPTIC_PATTERNS[kind]]);
}
```

### `src/shared/lib/audio.ts` — iOS 잠금 해제의 주인

iOS의 `AudioContext`는 suspended로 시작하며 **사용자 제스처 핸들러 안에서 `resume()`** 해야 풀린다(2026-07-25 확인). 그 제스처가 랜딩의 "Start learning" 탭이다 — Phase 7의 `StartLearningButton`에 지금 배선한다:

```ts
let context: AudioContext | null = null;

/** 반드시 클릭/터치 핸들러에서 호출. 이후 어디서든 소리를 낼 수 있다. */
export async function initAudio(): Promise<void> {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  context ??= new AudioContext();
  if (context.state === "suspended") await context.resume();
}

export function isAudioReady(): boolean {
  return context?.state === "running";
}
```

효과음 재생 헬퍼(에셋 로딩·스프라이트)는 게임 스펙과 함께 이 파일에 추가한다 — 스캐폴드가 소유하는 것은 잠금 해제 배관까지다.

**`StartLearningButton` 배선 (Phase 7 예고분)** — onClick을 다음으로 교체:

```tsx
import { initAudio } from "@/shared/lib/audio";
// ...
<Button
  size="lg"
  onClick={() => {
    void initAudio(); // 잠금 해제는 제스처 안에서 시작되면 충분 — 내비게이션을 막지 않는다
    router.push(ROUTES.game);
  }}
>
  Start learning
</Button>
```

### `src/shared/lib/speech.ts` — TTS (영어 UI × 글 못 읽는 아이 = 평소보다 중요)

`speechSynthesis`는 전 모던 브라우저 지원. 단 iOS는 **첫 `speak()`가 제스처 핸들러 안**이어야 하며(밖이면 조용히 무시), 첫 제스처 후 해제된다 — 게임의 음성 안내는 항상 상호작용에서 시작되므로 자연 충족된다.

```ts
import { SPEECH_LANG, SPEECH_RATE } from "@/shared/config/feedback";

export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // 겹침 방지 — 최신 안내가 항상 이긴다
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LANG;
  utterance.rate = SPEECH_RATE;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
```

### `src/shared/lib/motion.ts` — 틸트의 예약 seam (구현 최소, 결정은 게임 스펙에서)

iOS 13+는 `DeviceOrientationEvent.requestPermission()`(HTTPS + 사용자 제스처 필수, 거부 가능)을 요구하고, Android는 권한 개념 없이 동작한다. 이 비대칭을 여기서 흡수한다 — **게임 코드는 granted/denied/unsupported만 본다.** 틸트 이벤트 구독 API(`subscribeTilt`)는 게임 스펙이 틸트를 채택할 때 이 파일에 추가한다.

```ts
export type MotionAccess = "granted" | "denied" | "unsupported";

/** 반드시 사용자 제스처 핸들러에서 호출 (iOS 요구사항). HTTPS 전제. */
export async function requestMotionAccess(): Promise<MotionAccess> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return "unsupported";
  }
  // iOS 13+만 정적 requestPermission()을 가진 비표준 확장 —
  // 피처 디텍션 캐스트 허용(컨벤션의 두 번째 예외, 주석 필수)
  const ctor = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  if (typeof ctor.requestPermission !== "function") return "granted"; // Android 등
  try {
    return await ctor.requestPermission();
  } catch {
    return "denied"; // 제스처 밖 호출 등 reject → 거부로 간주
  }
}
```

호출부 규칙: **granted가 아니어도 게임은 완전히 동작해야 한다** — 틸트는 버튼/드래그 조작의 대체가 아니라 추가 수단이다(WCAG 2.5.7 드래그 대안 원칙과 정합).

### Capability 정책 (프로젝트 컨벤션 — 게임 스펙이 상속)

**네 capability(햅틱·오디오·음성·틸트)는 전부 progressive enhancement다. 넷이 모두 불가능한 환경에서도 제품은 완전히 사용 가능해야 한다.** 플랫폼 분기는 이 네 파일 안에만 존재한다 — 게임 코드에 `navigator.vibrate`·`speechSynthesis`·`DeviceOrientationEvent`·UA 스니핑이 등장하면 리뷰에서 반려.

**성공 확인**:
- `npx tsc --noEmit` 통과, `npm run build` 통과 (프리렌더 중 `window` 참조 크래시 없음 = SSR 가드 검증).
- 경계 검증: `grep -rn "navigator.vibrate\|speechSynthesis\|DeviceOrientationEvent" src --include="*.ts" --include="*.tsx"` → capability 모듈 3개 파일에서만 검출.
- 실동작: `GamePage`에 임시 버튼 4개(vibrate("success") / initAudio 후 isAudioReady 표시 / speak("Welcome to Cross Safe") / requestMotionAccess 결과 표시)를 넣고 — 데스크톱 Chrome: 에러 0(진동은 no-op), 휴대폰(가능하면 iOS): 진동만 조용히 무시되고 음성 재생·모션 권한 프롬프트 동작 확인 → **버튼 원복**.

---

## Phase 11 — Lint/Format + 타입 규칙 + Steiger (8분)

Next 16부터 `next build`가 lint를 실행하지 않으므로 **어떤 것도 빌드를 막지 않는다** — POC에 딱 맞는 기본값. 세 가지를 얹는다.

### (a) Prettier

```bash
npm i -D prettier
echo '{}' > .prettierrc
printf 'node_modules\n.next\npackage-lock.json\n' > .prettierignore
npm pkg set scripts.format="prettier --write ."
```

### (b) 타입 안전성 규칙 — audit 타입 레인 선제 대응

`eslint.config.mjs`의 config 배열에 다음 오버라이드를 추가한다 (`eslint-config-next`의 `next/typescript` 프리셋이 typescript-eslint 플러그인을 로드하므로 규칙 참조가 유효하다):

```js
{
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "warn",
  },
},
```

**동작 확인 (가정 금지)**: 아무 `.ts` 파일에 `const x: any = 1;`을 임시로 넣고 `npm run lint` → `no-explicit-any` 에러가 뜨는지 확인 → 원복. (Next 기본 프리셋에 이미 켜져 있더라도 명시 추가는 무해하며, 프리셋 변경에 대한 보험이 된다.)

### (c) Steiger — FSD 구조의 기계적 검증

tsc는 import 방향 위반(예: shared가 pages를 import)을 못 잡는다. 공식 FSD 린터 Steiger가 잡는다. **패키지명 주의**: CLI는 `steiger`다 (`@feature-sliced/steiger`는 npm에 존재하지 않음 — 2026-07-25 레지스트리 404 확인). 룰 플러그인 `@feature-sliced/steiger-plugin`은 config에서 import하므로 함께 설치한다:

```bash
npm i -D steiger @feature-sliced/steiger-plugin
npm pkg set "scripts.lint:fsd=steiger ./src"
```

`steiger.config.ts` 생성 (Steiger 공식 README의 예시 그대로 — shared는 shadcn 관례상 파일 직접 import를 쓰므로 public-api 룰만 끈다):

```ts
import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ["./src/shared/**"],
    rules: {
      "fsd/public-api": "off",
    },
  },
]);
```

pre-commit 훅, CI 게이트는 만들지 않는다.

**성공 확인**: `npm run lint` 에러 0, `npm run format` 정상 종료, `npm run lint:fsd` 위반 0. 역검증: `src/shared/lib/cn.ts` 상단에 `import { HomePage } from "@/pages/home";`를 임시 추가 → `npm run lint:fsd`가 import 방향 위반을 보고하는지 확인 → 원복.

---

## Phase 12 — Git 첫 커밋 (3분)

```bash
git status                        # .next/, node_modules/ 가 안 보여야 정상
grep -n "env" .gitignore          # Next 기본 템플릿은 `.env*` — 즉 .env.example까지 무시된다
printf '# Public site URL, set on Vercel after first deploy\n# NEXT_PUBLIC_SITE_URL=\n' > .env.example

# 위 grep 결과가 `.env*` (또는 .env.example을 포함하는 패턴)이면 예외를 추가한다:
printf '\n# 변수 목록은 커밋한다\n!.env.example\n' >> .gitignore

git check-ignore -v .env.example  # 아무것도 출력되지 않아야 함 = 커밋 가능
git add -A
git commit -m "chore: base scaffold (Next 16, Tailwind v4, shadcn/ui, FSD, mobile foundation)"
```

**성공 확인**: `git log --oneline` 에 커밋 1개. `git status` clean.

---

## Phase 13 — Vercel 배포 (9분)

가장 빠른 프리뷰 URL 경로는 **Vercel CLI 직배포**다 (GitHub 리포 없이 동작). GitHub 연동은 게임 개발 중 협업이 필요해질 때 붙인다 — 단, audit 스킬을 브랜치 diff 모드로 쓰려면 remote가 필요하다(다음 섹션).

첫 배포가 성공하기 위한 조건 — 이 계획대로면 전부 이미 충족:
- `npm run build` 로컬 통과 (배포 전 반드시 1회 실행)
- `package-lock.json` 존재 → Vercel이 npm으로 설치 (yarn.lock 부재 재확인)
- 프레임워크 자동 감지(Next.js), 필수 env var 없음

```bash
npm run build                     # 로컬에서 먼저 통과 확인
npx vercel@latest login           # 브라우저 인증
npx vercel                        # 질문에 전부 기본값 → 프리뷰 URL 출력
npx vercel --prod                 # 프로덕션 URL까지 원하면
```

배포 후: Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에 `NEXT_PUBLIC_SITE_URL=https://<프로덕션 도메인>` 추가 후 재배포하면 OG 절대 URL이 정확해진다 (안 해도 `VERCEL_URL` 폴백으로 동작).

**env var 컨벤션 (지금 정해두는 규칙 — audit 보안 레인 선제 대응)**:
- 로컬 비밀값은 `.env.local`(gitignore됨), 변수 목록은 `.env.example`에 이름만 커밋, Vercel에는 대시보드로 등록.
- `NEXT_PUBLIC_` 접두사가 붙은 값은 **브라우저 번들에 평문으로 들어간다** — 시크릿(API 키·토큰)은 절대 이 접두사를 쓰지 않는다. 서버 전용 값은 무접두사로 두면 클라이언트에 노출되지 않는다.
- 코드에 키·토큰 문자열 하드코딩 금지 — 지금은 시크릿이 0개인 것이 정상이며, 생기는 순간 이 컨벤션을 따른다.

**성공 확인**: CLI가 출력한 프리뷰 URL을 **실제 휴대폰**에서 열어 랜딩 → Start learning → /game 이동, 파비콘·OG(카톡/트위터 미리보기 디버거) 확인.

---

## audit 스킬을 돌릴 때 — diff base 주의 (스캐폴드 이후)

이 리포에서 `audit` 스킬을 돌리면 STEP 1이 diff base를 이렇게 결정한다 (스킬 소스 확인): `gh pr view` → `origin/HEAD` → `origin/develop`/`main` 폴백. **이 계획은 GitHub remote 없이 Vercel CLI로 배포하므로 `origin`이 없다** — 그 경우 스크립트는 BASE=main으로 폴백한 뒤 `git diff origin/main...HEAD`에서 `fatal: bad revision`으로 실패한다. 두 가지 해법:

1. **remote를 붙인다** (게임 개발 시작 전에 하는 것을 권장):
   ```bash
   gh repo create cross-safe --private --source=. --push
   git remote set-head origin -a    # origin/HEAD 설정 → audit의 2차 폴백이 바로 동작
   ```
   이후 게임 작업을 feature 브랜치에서 하면 `audit`이 main 대비 브랜치 diff를 자동으로 잡는다.
2. **경로 스코프로 호출한다** — audit은 파일/디렉토리 경로를 스코프로 받으면 diff 없이 해당 파일을 직접 읽는다. remote를 붙였더라도 **스캐폴드 커밋 자체를 감사하려면 이 방법뿐이다** (스캐폴드가 main에 push된 순간 main 대비 diff는 0건이므로): `"audit — app과 src 디렉토리"`처럼 경로를 명시해 요청한다.

---

## 프로젝트 컨벤션 — 게임 코드가 상속하는 규칙

스캐폴드가 위 페이즈들에서 이미 지키고 있는 규칙의 요약이다. 게임 구현도 이 기준으로 audit을 통과한다.

**구조 (FSD — Steiger가 기계 검증)**
- import 방향: 루트 `app/`(라우트) → `@/pages/*` → `@/shared/*` 단방향. 같은 레이어 슬라이스 간 import 금지.
- `widgets`/`features`/`entities` 레이어는 2곳 이상 재사용이 확인될 때 생성. 그 전까지 게임 코드는 전부 `src/pages/game/` 안.
- 기술 역할 파일명(`types.ts`, `utils.ts`, `helpers.ts`) 금지 — 도메인 이름 사용.
- 영속화(`localStorage` 등)는 `src/shared/api/` 밖에서 등장 금지.

**Capability (Phase 10 정책 재확인)**
- 햅틱·오디오·음성(TTS)·틸트는 전부 **progressive enhancement** — 넷이 모두 불가능한 환경에서도 제품은 완전히 사용 가능해야 한다. 게임 스펙은 이를 전제로 설계한다.
- 플랫폼 분기·브라우저 API 직접 호출(`navigator.vibrate`, `speechSynthesis`, `DeviceOrientationEvent`, UA 스니핑)은 `src/shared/lib/`의 capability 모듈 안에만 존재. 게임 코드에 등장하면 반려 (grep으로 기계 검증).
- 틸트는 추가 수단이지 대체 수단이 아니다 — 모든 틸트 인터랙션에는 버튼/드래그 대안이 있어야 한다 (WCAG 2.5.7 정합).

**접근성 (WCAG 2.2)**
- 페이지당 `<h1>` 1개, heading 레벨 건너뛰기 금지, 콘텐츠는 `<main>` 안에.
- `outline-none`을 대체 포커스 링 없이 쓰지 않는다 (2.4.7). shadcn의 `focus-visible:` 클래스를 지운 코드는 리뷰에서 반려.
- 인터랙티브 요소 최소 44×44px (2.5.8 — 아이 대상이므로 권장값을 최소값으로 채택).
- 텍스트 대비 4.5:1 이상 — 새 색 토큰을 추가할 때는 대비를 **측정**하고 커밋 메시지나 주석에 수치를 남긴다.
- 색상만으로 정보 전달 금지 (게임의 정답/오답 표시에 특히 — 텍스트·아이콘 병행).
- 동적 상태 변화는 `role="alert"`(에러)/`role="status"`(로딩·안내)로 전달.
- 애니메이션은 전역 reduced-motion CSS의 적용을 받는다. JS 주도 애니메이션(향후 게임 루프)은 `matchMedia("(prefers-reduced-motion: reduce)")`를 직접 확인.
- `div`에 `onClick` 금지 — `button` 사용. 아이콘 전용 버튼엔 `aria-label`.

**타입**
- `any` 금지 (`unknown` + narrowing). ESLint `no-explicit-any: error`가 강제.
- `as` 단언 금지 — 타입 가드로 좁힌다. 예외는 딱 두 곳, 둘 다 주석 필수: (1) 신뢰 경계의 역직렬화(`src/shared/api/local-storage.ts`), (2) 비표준 브라우저 API 피처 디텍션(`src/shared/lib/motion.ts`의 iOS `requestPermission`).
- 타입 전용 import는 `import type` (`consistent-type-imports`가 안내).
- 파생 타입은 `Partial`/`Pick`/`Omit`으로 — 중복 정의 금지.

**클린 코드 / 성능**
- 매직 넘버·문자열은 `src/shared/config/`(앱 전역) 또는 해당 슬라이스 `model/`(도메인 소유) 상수로.
- 파일 200줄·함수 50줄을 넘으면 분리 신호 (audit 코드 스멜 기준).
- `'use client'`는 그것이 필요한 **최말단 컴포넌트에만** (현재: OrientationPrompt, use-media-query, StartLearningButton, error.tsx — capability 모듈은 지시어 없는 일반 함수로 SSR 가드를 가짐). 페이지·레이아웃은 서버 컴포넌트 유지 — 게임에서 상호작용 컴포넌트가 늘어도 이 규칙은 유지한다.
- 독립적인 async 작업은 `Promise.all`로 병렬화.

---

## Definition of Done — 스캐폴드 완료 체크리스트

- [ ] `npm run build` 로컬 통과, `npx tsc --noEmit` 에러 0
- [ ] `corepack yarn --version`이 npm 프로젝트라며 거부하고, `yarn.lock`이 없다
- [ ] dev 서버 기동 로그에 workspace root 경고 없음
- [ ] `npm run lint` 에러 0 (+ 임시 `any` 삽입 시 걸리는 것 1회 확인), `npm run lint:fsd` 위반 0 (+ 임시 역방향 import 삽입 시 걸리는 것 1회 확인)
- [ ] `/`, `/game`, not-found, 파비콘, OG 메타태그 확인 — 각 페이지 `main` 1개·`h1` 1개
- [ ] DevTools 대비 검사: primary 버튼 라벨 4.94:1(≥4.5, AA 표시) 확인
- [ ] 휴대폰 실기기에서: 전체 높이 레이아웃이 주소창 개폐에 안 깨짐(dvh), 더블탭 줌 없음, pull-to-refresh 없음, 버튼 높이 44px+, Tab 포커스 링 표시
- [ ] **OrientationPrompt, 휴대폰 실기기**: 세로에서 안내 표시(회전 잠금 안내 문구 포함), 가로로 돌리면 **버튼 조작 없이** 즉시 원래 화면 복귀
- [ ] **OrientationPrompt, 데스크톱**: 좁고 긴 창에서 "Make this window wider!" 표시(회전 잠금 문구는 없어야 함), 넓히면 즉시 소멸
- [ ] Capability 모듈: `GamePage` 임시 테스트 버튼 4종이 데스크톱·휴대폰에서 에러 0 (iOS는 진동만 조용히 no-op) → 확인 후 원복. `npm run build` 통과로 SSR 가드 검증
- [ ] `grep -rn "localStorage" app src --include="*.ts" --include="*.tsx"` → `src/shared/api/local-storage.ts` 1개 파일만
- [ ] `grep -rn "navigator.vibrate\|speechSynthesis\|DeviceOrientationEvent" src --include="*.ts" --include="*.tsx"` → capability 모듈 3개 파일만
- [ ] Vercel 프리뷰 URL 접속 성공
- [ ] 첫 커밋 존재, working tree clean

## 명시적으로 하지 않는 것 (스코프 방어)

- FSD `widgets`/`features`/`entities` 레이어 — 빈 폴더 금지 원칙. 재사용 2곳 확인 시점에 생성
- `src/app/` (FSD app 레이어 분리) — 루트 `app/`이 겸함 (Phase 4의 이탈 기록). provider가 생기면 그때 `src/app/providers/`
- 테스트 프레임워크 (Vitest/Playwright) — 게임 로직이 생기기 전엔 테스트 대상이 없음
- i18n 라이브러리 — 결정 사항. 영어 하드코딩
- 인증, DB, API 라우트 — `src/shared/api` 경계 뒤로 연기됨
- 애널리틱스/에러 트래킹 (Vercel Analytics, Sentry)
- **iOS 진동 폴리필** (`ios-vibrator-pro-max`류) — DOM 전체를 `<label>`로 감싸 숨은 스위치를 토글하는 방식이라 접근성 작업과 정면 충돌하고, 클릭 스코프 grant가 1초 만에 만료되며, 1초 이상 패턴엔 메인스레드 블로킹이 필요. 햅틱은 Android 한정 강화로만 (`src/shared/lib/haptics.ts`)
- **틸트 인터랙션** — 게임 스펙으로 연기 (권한 비용 대비 가치를 스펙에서 판단). `src/shared/lib/motion.ts`가 seam으로 예약됨
- **`screen.orientation.lock()` 사용** — iOS Safari 미지원(Safari 16.4도 lock 제외). OrientationPrompt가 이식 가능한 대안
- 효과음 에셋·오디오 스프라이트 — 게임 스펙과 함께. 스캐폴드는 unlock 배관까지만
- PWA / 오프라인 / 푸시
- 다크 모드 대응 (라이트 고정)
- CI 파이프라인, pre-commit 훅, 커밋 컨벤션 도구 (Steiger·ESLint는 수동 실행)
- 스토리북/디자인 시스템 문서화
- GitHub 리포 연동 (audit 브랜치 diff가 필요해지는 시점에 — 위 audit 섹션 참조)
- 접근성 전수 감사 (스크린리더 실사용 테스트 등) — 위 컨벤션 섹션의 기본기까지만

이 목록의 항목을 12시간 안에 추가하고 싶어지면, 그 시간은 게임에서 빠져나간다는 뜻이다.
