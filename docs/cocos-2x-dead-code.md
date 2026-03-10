# Cocos Creator 2.x - Dead Code Elimination

릴리즈 빌드 시 `CC_DEBUG` 매크로를 활용하여 치트/디버그 코드를 자동 제거하는 방법.

## 매크로 목록

| 매크로 | Editor | Preview | Debug Build | Release Build |
|--------|--------|---------|-------------|---------------|
| `CC_DEBUG` | `true` | `true` | `true` | **`false`** |
| `CC_DEV` | `true` | `true` | **`false`** | **`false`** |
| `CC_BUILD` | `false` | `false` | `true` | `true` |
| `CC_PREVIEW` | `false` | `true` | `false` | `false` |
| `CC_EDITOR` | **`true`** | `false` | `false` | `false` |

- `CC_DEBUG` = 에디터, 프리뷰, 또는 디버그 빌드에서 실행 중
- `CC_DEV` = 에디터 또는 프리뷰에서 실행 중 (빌드 환경에서는 항상 `false`)

릴리즈 빌드 시 `CC_DEBUG`가 `false`로 치환된 후, minifier(UglifyJS)가 unreachable code를 제거한다.

## 사용법

```javascript
cc.Class({
    extends: cc.Component,

    onLoad: function () {
        // 항상 실행됨
        cc.log("일반 코드");

        if (CC_DEBUG) {
            // 릴리즈 빌드에서 이 블록 전체가 제거됨
            require("@TinycellCorp/cheatjs");
            cheat.add("test", function() {
                console.log("execute");
            });
        }
    },
});
```

## 검증 결과

Cocos Creator 2.x CLI 빌드(`CocosCreator --build`)로 실제 확인한 결과.

### 디버그 빌드 (`debug: true`)

```javascript
onLoad: function onLoad() {
    cc.log("[TEST] 일반 코드 실행됨");
    true;  // CC_DEBUG → true로 치환
    cc.log("[TEST] CC_DEBUG 블록 실행됨 - 릴리즈에서는 안 보여야 함");
    this._debugOnlyValue = "치트 데이터";
    require("@TinycellCorp/cheatjs");
    console.log("cheat activate!");
    cheat.add("test", function() { console.log("execute"); });
}
```

### 릴리즈 빌드 (`debug: false`)

```javascript
onLoad: function() {
    cc.log("[TEST] 일반 코드 실행됨")
}
```

### 문자열 비교

| 문자열 | 디버그 | 릴리즈 |
|--------|--------|--------|
| `cheat activate` | O | X (제거) |
| `debugOnlyValue` | O | X (제거) |
| `CC_DEBUG` 식별자 | X (`true`로 치환됨) | X (제거) |
| cheatjs 라이브러리 코드 | O | **O (잔존)** |

`if (CC_DEBUG)` 블록 안의 **사용 코드는 완전히 제거**된다. 하지만 cheatjs **패키지 코드 자체는 남는다**.

## 주의사항

### 패키지 코드 잔존 (2.x 번들러 한계)

`require`/`import`를 `CC_DEBUG` 안에 넣어도 패키지 코드는 번들에 남는다. 2.x 번들러가 정적 분석으로 의존성을 먼저 수집하기 때문.

```javascript
if (CC_DEBUG) {
    require("@TinycellCorp/cheatjs");  // 사용 코드는 제거되지만
}
// → cheatjs 라이브러리 코드는 번들에 포함됨 (호출만 안 됨)
```

치트 로직은 제거되므로 **데이터 조작 위험은 없지만**, 번들 크기에 약간의 영향이 있다.

### devDependencies는 효과 없음

`package.json`에서 `devDependencies`로 옮겨도 Cocos 2.x 번들러는 `require`/`import` 기반으로 해석하므로 빌드 결과에 차이 없음.

### 정적 import문은 조건문으로 감쌀 수 없음

```javascript
// 불가능 - SyntaxError
if (CC_DEBUG) {
    import cheatjs from "@TinycellCorp/cheatjs";
}

// 대신 require 사용
if (CC_DEBUG) {
    require("@TinycellCorp/cheatjs");
}
```

## 권장 패턴

`require` + `CC_DEBUG` 조합. 패키지 코드는 잔존하지만 치트 로직은 완전히 제거됨.

```javascript
onLoad: function () {
    if (CC_DEBUG) {
        require("@TinycellCorp/cheatjs");
        cheat.addGroup("Player", {
            "God Mode": function() { player.invincible = true; },
            "Add Gold": [function() { player.gold += 1000; }, "골드 추가"]
        });
    }
},
```
