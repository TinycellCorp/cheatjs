---
description: |
  cheatjs 프로젝트 배포 스킬. 패키지(npm) + 스킬(Claude Code 플러그인) 통합 배포.
  배포 전 검증, 버전 자동 결정, npm publish, 프리뷰 배포를 한 번에 처리한다.
  release, 배포, 릴리즈, publish, npm version 관련 작업 시 이 스킬을 사용한다.
allowed-tools:
  - Read
  - Bash(node scripts/validate-release.js:*)
  - Bash(npm run release:*)
  - Bash(git:*)
  - AskUserQuestion
user-invocable: true
---

# /release — cheatjs 배포

패키지 + 스킬 통합 배포를 실행한다. 서브커맨드 없이 변경점 분석으로 버전을 자동 결정한다.

## 실행 흐름

### Step 1: 검증 + 버전 결정

```bash
node scripts/validate-release.js --json
```

JSON 결과를 파싱하여:
- `passed: false` → 에러 목록을 표시하고 중단
- `passed: true` → 다음 단계로 진행

### Step 2: 결과 표시

검증 결과와 버전 결정을 사용자에게 보여준다:

```
✓ 검증 8/8 통과
✓ 자동 버전: minor (feat: 2개, fix: 1개)
✓ 변경 커밋:
  - feat: 문자열 반환 시 버튼 내부 티커 피드백
  - fix: 티커 타이머 경쟁 조건 수정
  - refactor: 티커 슬라이드를 센터 표시 방식으로 전환
```

### Step 3: 사용자 확인

AskUserQuestion으로 확인:

| 선택지 | 동작 |
|--------|------|
| 배포 진행 | 자동 결정된 버전으로 `npm run release:{version}` 실행 |
| 버전 오버라이드 | patch/minor/major 중 선택 후 실행 |
| 취소 | 중단 |

### Step 4: 배포 실행

```bash
npm run release:{version}
```

이 명령은 순서대로:
1. `npm version {version}` → build + sync-version + git commit + tag
2. `git push` + `git push --tags`
3. `npm publish`
4. `deploy:preview` (Vite 빌드 + gh-pages)
5. `post-release.js` (REMINDER 출력)

### Step 5: 결과 보고

성공 시:
```
✓ v{version} 배포 완료
  - npm: @TinycellCorp/cheatjs@{version}
  - preview: gh-pages 배포됨
  - 스킬: plugin.json + api-reference.md 동기화됨
```

### Step 6: 실패 시 복구 가이드

배포 중 실패하면 아래 복구 절차를 안내한다:

**npm publish 실패 (커밋+태그가 이미 push된 경우):**
```bash
git tag -d v{version}
git push origin :refs/tags/v{version}
git revert HEAD
git push
```

**push 전 실패:**
```bash
git reset --hard HEAD~1
git tag -d v{version}
```

---

## 버전 없이 검증만 실행

`$ARGUMENTS`가 `check`인 경우:

```bash
node scripts/validate-release.js
```

검증 결과만 표시하고 배포는 하지 않는다.
