---
description: |
  cheatjs API 레퍼런스, 설치 가이드, 코드 작성 도우미.
  cheat.add, cheat.addGroup, cheat.remove, cheat.clear, cheat.statusline,
  cheat.show, cheat.hide, cheat.toggle, 셀렉트, 반환값, 치트 버튼,
  디버그 치트 UI, CC_DEBUG/DEBUG 매크로, 데드코드 제거,
  dynamic import, await import 잔존물 관련 작업 시 반드시 이 스킬을 사용한다.
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

# cheatjs

`@TinycellCorp/cheatjs` 통합 스킬. 설치 가이드, API 레퍼런스, 코드 작성 도우미를 제공한다.

## 서브커맨드

`$ARGUMENTS`를 파싱하여 분기한다:

| 입력 | 동작 |
|------|------|
| `setup` | 패키지 설치 가이드 (npmrc + npm install) |
| `api` | 전체 API 레퍼런스 출력 |
| `api <키워드>` | 특정 API 섹션만 출력 (add, group, select, return, statusline, toggle) |
| (자연어) | API 레퍼런스를 참조하여 질문에 맞는 답변/코드 예제 제공 |

---

## setup 서브커맨드

`$ARGUMENTS`가 `setup`인 경우 실행한다.

### Step 1: .npmrc 확인

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

### Step 2: npm install

```bash
npm install @TinycellCorp/cheatjs
```

설치 실패 시:

| 에러 코드 | 원인 | 대응 |
|-----------|------|------|
| 401 | auth token 미설정/만료 | Step 1로 복귀 |
| 403 | PAT에 read:packages 스코프 없음 | PAT 재생성 안내 |
| 404 | registry 미설정 | Step 1로 복귀 |

### Step 3: 완료 안내

```
cheatjs 설치 완료: @TinycellCorp/cheatjs@{설치된 버전}

다음 단계:
- API 확인: /cheatjs api
- import: require('@TinycellCorp/cheatjs'); 또는 import '@TinycellCorp/cheatjs';
  (side-effect import - window.cheat로 전역 등록됨, 변수 할당 불필요)
- 프로덕션 제거: /cheatjs api 에서 "프로덕션 빌드 제거" 섹션 참조
- UI 열기: Shift+Click (데스크탑) / 트리플 탭 (모바일)
```

### 에러 처리

| 상황 | 대응 |
|------|------|
| .npmrc 파일이 없음 | 프로젝트 루트에 새로 생성할지 AskUserQuestion |
| npm install 401/403/404 | 에러별 .npmrc 설정 안내 |

---

## api 서브커맨드

`$ARGUMENTS`가 `api` 또는 `api <키워드>`인 경우 실행한다.

### 키워드 분기

```
Read("./docs/api-reference.md")
```

파일 전체를 읽은 뒤, 키워드가 있으면 해당 섹션(## 헤딩 기준)만 출력한다. 키워드가 없으면 전체를 출력한다.

| 키워드 | 출력 섹션 |
|--------|----------|
| (빈값) | 전체 API 레퍼런스 |
| `add` | cheat.add() 상세 |
| `group` 또는 `addGroup` | cheat.addGroup() 상세 |
| `select` | 셀렉트 버튼 설정 상세 |
| `return` 또는 `state` | 버튼 반환값 제어 상세 |
| `statusline` | 상태라인 상세 |
| `show` 또는 `hide` 또는 `toggle` | UI 제어 상세 |

---

## 자연어 모드

`$ARGUMENTS`가 `setup`이나 `api`로 시작하지 않는 경우 자연어 모드로 동작한다.

### 실행 방법

1. `./docs/api-reference.md`를 Read로 읽는다.
2. 사용자의 질문/요청에 맞는 답변, 코드 예제, 패턴을 제공한다.
3. 프로젝트의 코드 스타일을 따른다 (ES5 제약은 cheat.js 소스 개발에만 해당).

### 예시

| 입력 | 출력 |
|------|------|
| `/cheatjs 토글 치트 만들어줘` | 토글 패턴 코드 예제 + 반환값 설명 |
| `/cheatjs 셀렉트로 서버 선택 만들어줘` | 셀렉트 설정 코드 예제 |
| `/cheatjs 프로덕션에서 치트 코드 제거하는 법` | 데드코드 제거 패턴 안내 |

---

## 코드 작성 시 주의사항

이 스킬의 API를 참조하여 치트 코드를 작성할 때:

- **코드 스타일은 프로젝트를 따른다** - 화살표 함수, let/const 등 자유롭게 사용 가능. ES5 제약은 cheat.js 소스코드 개발에만 해당.
- **import는 반드시 데드코드 가드 안에서** - api의 "프로덕션 빌드 제거" 섹션의 엔진별 패턴을 따른다.
- **side-effect import** - `require('@TinycellCorp/cheatjs')` 또는 `import '@TinycellCorp/cheatjs'` (`var cheat = require(...)` 금지 - module.exports 없음)
- 셀렉트 기본값 프로퍼티: `default` (`defaultValue` 아님)

### 런타임 흐름 시뮬레이션 원칙

**치트 콜백은 실제 런타임 흐름을 시뮬레이션하도록 구현해야 한다.** 단순히 변수를 직접 조작하는 대신, 실제 게임에서 해당 동작이 발생했을 때와 동일한 흐름(이벤트 발행, UI 갱신, 서버 동기화 등)을 재현해야 한다.

```javascript
// 나쁜 예 - 변수 직접 조작 (UI 미갱신, 이벤트 미발행)
cheat.add("골드 +1000", () => {
    player.gold += 1000;
});

// 좋은 예 - 실제 보상 흐름 재현
cheat.add("골드 +1000", () => {
    rewardManager.giveReward({ type: 'gold', amount: 1000 });
});

// 좋은 예 - 매니저가 없는 경우에도 흐름 재현
cheat.add("골드 +1000", () => {
    player.gold += 1000;
    player.emit('goldChanged', player.gold);
    uiManager.refresh();
});
```

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
