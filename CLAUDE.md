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

## Release Checklist

배포 전 반드시 아래 항목을 확인한다.

1. **`npm run build` 통과** - 4단계 모두 성공해야 함
2. **`cheat.d.ts` 동기화** - 구조체/인터페이스 변경 시 타입 선언 업데이트
3. **`README.md` 업데이트** - 새 기능/API 변경 시 문서 반영
4. **플러그인 API 레퍼런스 동기화** - API 변경 시 `plugin/skills/api/docs/api-reference.md` 업데이트 (수동 편집)
5. **커밋 완료** - 위 파일들이 모두 커밋된 상태에서 배포

```bash
npm run release:patch   # patch 배포
npm run release:minor   # minor 배포
npm run release:major   # major 배포
```

> `post-release.js`가 marketplace.json, plugin.json, api-reference.md 버전을 자동 동기화한다.

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
- `/cheatjs:setup` - .npmrc 확인 + npm install
- `/cheatjs:api` - 전체 API 레퍼런스
- `/cheatjs:api <키워드>` - 특정 API 상세

## Files
| 파일 | 역할 |
|------|------|
| `cheat.js` | 메인 소스 (직접 편집) |
| `cheat.min.js` | 빌드 산출물 (편집 금지) |
| `cheat.d.ts` | TypeScript 타입 선언 |
| `dev/` | Vite 프리뷰 환경 (배포에 포함 안됨) |
| `plugin/` | Claude Code 플러그인 (npm 패키지에 포함 안됨) |
| `.claude-plugin/` | 마켓플레이스 카탈로그 |
