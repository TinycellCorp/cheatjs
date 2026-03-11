---
description: |
  cheatjs 패키지 설치 및 .npmrc 설정 가이드.
  cheatjs 설치, npm install, .npmrc, GitHub Packages 인증,
  npm 404/401/403 에러 해결 시 이 스킬을 사용한다.
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash(npm install:*)
  - Bash(npm ls:*)
  - AskUserQuestion
user-invocable: true
---

# cheatjs setup

`.npmrc` 설정을 확인하고 `@TinycellCorp/cheatjs` 패키지를 설치한다.

## Step 1: .npmrc 확인

프로젝트 루트 `.npmrc` 또는 `~/.npmrc` 파일을 Read 도구로 읽어 다음 **두 줄 모두** 있는지 확인한다:

```
@TinycellCorp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<TOKEN>
```

| 상태 | 대응 |
|------|------|
| 두 줄 모두 있음 | Step 2로 진행 |
| registry 줄만 있음 | AskUserQuestion: `.npmrc`에 GitHub auth token이 설정되어 있지 않습니다. GitHub PAT (read:packages 스코프)를 생성하여 `//npm.pkg.github.com/:_authToken=YOUR_TOKEN` 줄을 추가해야 합니다. PAT 생성: https://github.com/settings/tokens |
| 두 줄 모두 없음 | AskUserQuestion: GitHub Packages 접근을 위해 `.npmrc` 설정이 필요합니다. (1) `@TinycellCorp:registry=https://npm.pkg.github.com` (2) `//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN` 프로젝트 `.npmrc`에 추가할지 확인. |
| auth token만 있고 registry 없음 | registry 줄 추가를 제안 |

**주의:** auth token 값 자체는 절대 코드나 출력에 포함하지 않는다.

## Step 2: npm install

```bash
npm install @TinycellCorp/cheatjs
```

설치 실패 시:

| 에러 코드 | 원인 | 대응 |
|-----------|------|------|
| 401 | auth token 미설정/만료 | Step 1로 복귀 |
| 403 | PAT에 read:packages 스코프 없음 | PAT 재생성 안내 |
| 404 | registry 미설정 | Step 1로 복귀 |

## Step 3: 완료 안내

```
cheatjs 설치 완료: @TinycellCorp/cheatjs@{설치된 버전}

다음 단계:
- API 확인: /cheatjs:api
- import: require('@TinycellCorp/cheatjs'); 또는 import '@TinycellCorp/cheatjs';
  (side-effect import - window.cheat로 전역 등록됨, 변수 할당 불필요)
- 프로덕션 제거: /cheatjs:api 에서 "프로덕션 빌드 제거" 섹션 참조
- UI 열기: Shift+Click (데스크탑) / 트리플 탭 (모바일)
```

---

## 에러 처리

| 상황 | 대응 |
|------|------|
| .npmrc 파일이 없음 | 프로젝트 루트에 새로 생성할지 AskUserQuestion |
| npm install 401/403/404 | 에러별 .npmrc 설정 안내 |
