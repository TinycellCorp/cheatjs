# Cocos Creator 3.x - Dead Code Elimination

릴리즈 빌드 시 `DEBUG` 상수를 활용하여 치트/디버그 코드를 자동 제거하는 방법.

## 매크로 사용법

3.x에서는 글로벌 `CC_DEBUG` 대신 `cc/env` 모듈에서 import한다.

```typescript
import { DEBUG } from 'cc/env';
```

| 상수 | Editor | Preview | Debug Build | Release Build |
|------|--------|---------|-------------|---------------|
| `DEBUG` | `true` | `true` | `true` | **`false`** |
| `DEV` | `true` | `true` | `true` | **`false`** |
| `BUILD` | `false` | `false` | `true` | `true` |
| `PREVIEW` | `false` | `true` | `false` | `false` |
| `EDITOR` | **`true`** | `false` | `false` | `false` |

- `DEBUG` = 에디터, 프리뷰, 또는 디버그 빌드에서 실행 중
- `DEV` = `DEBUG || EDITOR || PREVIEW` (2.x `CC_DEV`와 의미가 다름 — 아래 비교 참고)

## 사용법

dynamic import + `.then()` 패턴으로 패키지 코드까지 완전 제거 가능.

```typescript
import { _decorator, Component, log } from 'cc';
import { DEBUG } from 'cc/env';
const { ccclass } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    onLoad() {
        log('일반 코드');

        if (DEBUG) {
            import("@TinycellCorp/cheatjs").then(() => {
                cheat.addGroup("Player", {
                    "God Mode": () => { player.invincible = true; },
                    "Add Gold": [() => { player.gold += 1000; }, "골드 추가"]
                });
            });
        }
    }
}
```

## 검증 결과

Cocos Creator 3.3.2 CLI 빌드(`CocosCreator --build`)로 실제 확인한 결과.

### 디버그 빌드 (`debug: true`)

사용 코드 + cheatjs 패키지 코드 모두 번들에 포함됨.

- `assets/main/index.js`: `cheat.add`, `cheat activated!`, dynamic import 코드 포함
- `src/chunks/bundle.js`: cheatjs 패키지 코드 전체 포함

### 릴리즈 빌드 (`debug: false`)

```javascript
o.prototype.onLoad = function() {
    r("[TEST] 일반 코드 실행됨")
}
```

- `assets/main/index.js`: `cheat` 관련 코드 **완전 제거**
- `src/chunks/bundle.js`: cheatjs 패키지 코드 **0건**

### 문자열 비교

| 문자열 | 디버그 | 릴리즈 |
|--------|--------|--------|
| `cheat activated` | O | X (제거) |
| `cheat.add` | O | X (제거) |
| cheatjs 패키지 코드 (`bundle.js`) | O | **X (완전 제거)** |

2.x와 달리 **사용 코드와 패키지 코드 모두 완전히 제거**된다.

## 주의사항

### await import() 사용 금지

`await import()`를 사용하면 Babel의 generator 변환으로 인해 unreachable 코드 잔존물이 남는다.

```typescript
// 나쁜 예 - generator 변환 잔존물 발생
async onLoad() {
    if (DEBUG) {
        await import("@TinycellCorp/cheatjs");  // 잔존물 남음
    }
}

// 좋은 예 - 완전 제거
onLoad() {
    if (DEBUG) {
        import("@TinycellCorp/cheatjs").then(() => { ... });
    }
}
```

### tsconfig.json 설정

Cocos Creator 3.3.2 기본 설정은 `"module": "ES2015"`로 dynamic import를 지원하지 않는다. `tsconfig.json`에서 오버라이드 필요.

```json
{
  "extends": "./temp/tsconfig.cocos.json",
  "compilerOptions": {
    "strict": false,
    "module": "ES2020"
  }
}
```

런타임에는 Cocos 번들러(Rollup)가 모듈을 처리하므로 빌드에 영향 없음 (`noEmit: true` 설정이라 타입 체크용).

## 2.x vs 3.x 비교

| 항목 | 2.x | 3.x |
|------|-----|-----|
| 매크로 | `CC_DEBUG` (글로벌) | `import { DEBUG } from 'cc/env'` |
| 번들러 | 내장 번들러 + minifier | Rollup (tree-shaking) |
| 사용 코드 제거 | O | O |
| 패키지 코드 제거 | **X (잔존)** | **O (완전 제거)** |
| 권장 패턴 | `require` + `CC_DEBUG` | dynamic `import().then()` + `DEBUG` |

> **주의**: 2.x `CC_DEV`와 3.x `DEV`는 이름은 비슷하지만 의미가 다르다.
> - 2.x `CC_DEV` = 에디터 또는 프리뷰 (Debug Build에서 `false`)
> - 3.x `DEV` = `DEBUG || EDITOR || PREVIEW` (Debug Build에서 `true`)
