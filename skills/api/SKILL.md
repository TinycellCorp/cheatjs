---
description: |
  cheatjs API 레퍼런스 및 코드 작성 가이드.
  cheat.add, cheat.addGroup, cheat.remove, cheat.clear, cheat.statusline,
  cheat.show, cheat.hide, cheat.toggle, 셀렉트, 반환값, 치트 버튼,
  디버그 치트 UI, CC_DEBUG/DEBUG 매크로, 데드코드 제거,
  dynamic import, await import 잔존물 관련 작업 시 반드시 이 스킬을 사용한다.
allowed-tools:
  - Read
  - AskUserQuestion
user-invocable: true
---

# cheatjs API

`@TinycellCorp/cheatjs` API 레퍼런스를 조회한다.

## 사용법

| 명령어 | 설명 |
|--------|------|
| `/cheatjs:api` | 전체 API 레퍼런스 출력 |
| `/cheatjs:api <키워드>` | 특정 API 상세 (add, group, select, return, statusline, toggle) |

## 키워드 분기

`$ARGUMENTS`에서 키워드를 추출하여 해당 섹션만 출력한다:

| 키워드 | 출력 섹션 |
|--------|----------|
| (빈값) | 전체 API 레퍼런스 |
| `add` | cheat.add() 상세 |
| `group` 또는 `addGroup` | cheat.addGroup() 상세 |
| `select` | 셀렉트 버튼 설정 상세 |
| `return` 또는 `state` | 버튼 반환값 제어 상세 |
| `statusline` | 상태라인 상세 |
| `show` 또는 `hide` 또는 `toggle` | UI 제어 상세 |

## 실행 방법

```
Read("./docs/api-reference.md")
```

파일 전체를 읽은 뒤, 키워드가 있으면 해당 섹션(## 헤딩 기준)만 출력한다. 키워드가 없으면 전체를 출력한다.

---

## 코드 작성 시 주의사항

이 스킬의 API를 참조하여 치트 코드를 작성할 때:

- **코드 스타일은 프로젝트를 따른다** - 화살표 함수, let/const 등 자유롭게 사용 가능. ES5 제약은 cheat.js 소스코드 개발에만 해당.
- **import는 반드시 데드코드 가드 안에서** - 아래 "프로덕션 빌드 제거" 섹션의 엔진별 패턴을 따른다.
- **side-effect import** - `require('@TinycellCorp/cheatjs')` 또는 `import '@TinycellCorp/cheatjs'` (`var cheat = require(...)` 금지 - module.exports 없음)
- 셀렉트 기본값 프로퍼티: `default` (`defaultValue` 아님)

### add vs addGroup 판단

**`cheat.add()`가 기본이다.** 그룹이 필요한 경우에만 `addGroup`을 사용한다.

| 상황 | API | 예시 |
|------|-----|------|
| 개별 디버그 버튼 | `cheat.add()` | 골드 추가, 스테이지 클리어, 무적 토글 |
| 명확한 카테고리가 있을 때 | `cheat.addGroup()` | "Player" 그룹에 HP/MP/버프 관련 묶음 |

**`addGroup` 사용 기준:**
- 같은 도메인의 명령이 **3개 이상** 모여야 그룹화 의미 있음
- 1~2개 명령을 억지로 그룹화하지 않는다

```javascript
// 좋은 예 - 개별 명령은 add로
cheat.add("골드 +1000", () => { player.gold += 1000; });
cheat.add("스테이지 클리어", () => { stage.clear(); });

// 좋은 예 - 관련 명령이 충분히 모이면 그룹화
cheat.addGroup("Player", {
    "HP 회복": () => { player.hp = player.maxHp; },
    "MP 회복": () => { player.mp = player.maxMp; },
    "무적 토글": () => { player.invincible = !player.invincible; },
    "레벨업": () => { player.levelUp(); }
});
```

---

## 프로덕션 빌드 제거 (Dead Code)

cheatjs는 디버그 전용 패키지다. **프로덕션 빌드에서 자동 제거**되도록 엔진의 데드코드 매크로 안에서 import/사용해야 한다.

### Cocos Creator 2.x

`CC_DEBUG` + `require` 패턴. 치트 사용 코드는 완전 제거되지만, 패키지 코드는 번들에 잔존한다 (2.x 번들러 한계).

```javascript
onLoad: function () {
    if (CC_DEBUG) {
        require("@TinycellCorp/cheatjs");
        cheat.add("골드 +1000", () => { player.gold += 1000; });
        cheat.add("무적 토글", () => { player.invincible = !player.invincible; });
    }
},
```

### Cocos Creator 3.x

`DEBUG` + `import().then()` 패턴. 사용 코드와 패키지 코드 **모두 완전 제거**된다.

```typescript
import { DEBUG } from 'cc/env';

onLoad() {
    if (DEBUG) {
        import("@TinycellCorp/cheatjs").then(() => {
            cheat.add("골드 +1000", () => { player.gold += 1000; });
            cheat.add("무적 토글", () => { player.invincible = !player.invincible; });
        });
    }
}
```

**3.x 필수 규칙:**

| 규칙 | 이유 |
|------|------|
| `await import()` 사용 금지, `.then()` 사용 | `await`는 Babel generator 변환으로 코드 잔존물 발생 |
| `tsconfig.json`에 `"module": "ES2020"` 오버라이드 | 기본 `ES2015`는 dynamic import 미지원 |

tsconfig.json 설정:
```json
{
  "extends": "./temp/tsconfig.cocos.json",
  "compilerOptions": {
    "strict": false,
    "module": "ES2020"
  }
}
```

### 판단 기준

| 환경 | 패턴 | import 방식 |
|------|------|------------|
| Cocos 2.x | `if (CC_DEBUG)` | `require("@TinycellCorp/cheatjs")` |
| Cocos 3.x | `if (DEBUG)` | `import("@TinycellCorp/cheatjs").then()` |

### 주의사항

**여러 파일에서 cheatjs를 사용하는 경우**, 각 파일마다 가드 블록 안에서 `require`/`import`해야 한다. `require`는 캐싱되므로 중복 호출 비용 없음.

```javascript
// FileA.js
if (CC_DEBUG) {
    require("@TinycellCorp/cheatjs");
    cheat.add("골드 +1000", () => { player.gold += 1000; });
}

// FileB.js - 별도 파일에서도 동일 패턴
if (CC_DEBUG) {
    require("@TinycellCorp/cheatjs");
    cheat.add("적 전멸", () => { enemy.killAll(); });
}
```

가드 블록이 import와 사용을 함께 감싸므로, 런타임 가드(`typeof cheat !== 'undefined'`)는 불필요하다.
