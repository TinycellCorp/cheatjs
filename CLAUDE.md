# cheatjs - Claude Code Instructions

## Code Style
- ES5 only: `var`, no arrow functions, no `class`, no template literals
- Korean comments
- Single-file IIFE pattern in `cheat.js`
- All internal state as closure variables

## Build
```bash
npm run build    # inject-version + minify + validate-types + type-check
npm run dev      # Vite dev preview (dev/)
```

## Release

배포는 `/release` 스킬을 사용한다. 검증 + 버전 자동 결정 + 배포를 한 번에 처리.

```
/release        — 검증 → 버전 결정 → 확인 → 배포
/release check  — 검증만 (배포 안 함)
```

수동 배포가 필요한 경우:
```bash
node scripts/validate-release.js  # 검증
npm run release:patch              # patch 배포
```

> `sync-version.js`가 version hook에서 plugin.json, api-reference.md 버전을 릴리즈 커밋에 동기화한다.
> API 내용 변경은 `skills/cheatjs/docs/api-reference.md`를 수동 편집한다.

## Key Architecture
- `groups` object: `{ desc, commands[], tab, content, dropdownItem }`
- `ui` object: overlay, bottomSheet, tabBarWrapper, tabBar, dropdownEl, dropdownTrigger, dropdownMenu, toggleBtn, content
- `selectTab(groupKey)` - 탭 버튼 + 드롭다운 트리거/아이템 동시 업데이트
- `tabMode` ('tab'|'dropdown') - `localStorage('cheat-tab-mode')`에 저장
- `applyPersistentStyles()` - border 속성 클리어 후 `border: none` 복원 필수

## Plugin (Claude Code 플러그인)
```
/plugin marketplace add TinycellCorp/cheatjs
/plugin install cheatjs@tinycell-cheatjs
```
- `/cheatjs setup` - .npmrc 확인 + npm install
- `/cheatjs api` - 전체 API 레퍼런스
- `/cheatjs api <키워드>` - 특정 API 상세
- `/cheatjs <자연어>` - API 참조 기반 코드 작성 도우미

## Files
| 파일 | 역할 |
|------|------|
| `cheat.js` | 메인 소스 (직접 편집) |
| `cheat.min.js` | 빌드 산출물 (편집 금지) |
| `cheat.d.ts` | TypeScript 타입 선언 |
| `dev/` | Vite 프리뷰 환경 (배포에 포함 안됨) |
| `plugin/` | Claude Code 플러그인 (npm 패키지에 포함 안됨) |
| `.claude-plugin/` | 마켓플레이스 카탈로그 |
