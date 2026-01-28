# cheatjs

게임 엔진 독립적인 치트 UI (바텀시트)

## 설치

### npm (권장)

```shell
npm install @TinycellCorp/cheatjs
```

### CDN

```html
<!-- npm 패키지 기반 CDN (권장) -->
<script src="https://cdn.jsdelivr.net/npm/@TinycellCorp/cheatjs/cheat.min.js"></script>

<!-- 특정 버전 -->
<script src="https://cdn.jsdelivr.net/npm/@TinycellCorp/cheatjs@2.0.0/cheat.min.js"></script>

<!-- 원본 (디버깅용) -->
<script src="https://cdn.jsdelivr.net/npm/@TinycellCorp/cheatjs/cheat.js"></script>
```

## 빠른 시작

```typescript
// 1. side-effect import (전역 cheat 객체 등록)
import "@TinycellCorp/cheatjs";

// 2. 직접 호출 (권장)
if (cheat) {
    cheat({ '버튼명': () => console.log('클릭!') });
}
```

**핵심 포인트**:
- `import "@TinycellCorp/cheatjs"` - side-effect import로 전역 `cheat` 객체 등록
- `if (cheat)` - 프로덕션에서 미로드 시 안전하게 처리 (tree-shaking 등으로 제외된 경우)

## 사용법

```javascript
// 초기화
cheat();
cheat({ '버튼명': () => console.log('클릭!') });
cheat({ '버튼명': () => {} }, document.body);

// 상태라인 설정 (버전/환경 정보 표시)
cheat.statusline(opt => ['v1.0.0', 'hi5']);
// → "v1.0.0 | hi5"

// 동적 값 사용
cheat.statusline(opt => [getVersion(), getPlatform()]);

// 구분자 변경
cheat.statusline(opt => {
    opt.separator = ' - ';
    return ['v1.0.0', 'hi5'];
});

// 상태 갱신 (콜백 재실행)
cheat.statusline.refresh();

// 그룹 추가
cheat.addGroup('그룹명', {
    '버튼1': () => {},
    '버튼2': [() => {}, '설명']
});
```

## 제스처

| 플랫폼 | 제스처 |
|--------|--------|
| 데스크탑 | Shift + Click |
| 모바일 | 트리플 탭 (같은 위치 3번) |

## API

```javascript
cheat.show()              // UI 표시
cheat.hide()              // UI 숨김
cheat.toggle()            // 토글

// 상태라인 (버전/환경 정보)
cheat.statusline(callback)      // 상태라인 설정 (callback: opt => ['v1.0.0', 'hi5'])
cheat.statusline.refresh()      // 상태라인 갱신 (콜백 재실행)

cheat.add(name, action, groupKey?)  // 명령어 추가 (groupKey 생략 시 GLOBAL)
cheat.remove(name)                  // 명령어 삭제
cheat.clear()                       // 전체 삭제

cheat.addGroup(groupInfo, map)      // 그룹 추가 (groupInfo: string | [name, desc])
cheat.removeGroup(name)   // 그룹 삭제

cheat.list()              // 명령어 목록 출력
```

## 타입 지원

npm 패키지에 TypeScript 타입 정의(`cheat.d.ts`)가 포함되어 있습니다.

## 고급: postMessage API

iframe이나 웹뷰 환경에서 `cheat` 객체에 직접 접근할 수 없을 때 사용합니다.
대부분의 경우 위의 직접 호출 방식을 권장합니다.



```ts
// cheat(<actions>, <dom>)
// 내부에서 document.body 사용함.
window.postMessage({
    type: 'CHEAT_REQUEST',
    action: 'init',
    payload: {
        actions: [
            { name: '아이템 전체 추가', key: 'add-all-items' }
        ]
    }
} as CheatRequest, '*');

 // 이벤트 수신
window.addEventListener('message', this.handleCheatEvent.bind(this));

function handleCheatEvent(e: MessageEvent): void {
    const data = e.data as CheatEvent;
    if (data.type !== 'CHEAT_EVENT') return;
    if (data.event !== 'action_triggered') return;

    const key = data.payload.key;
    switch (key) {
        case 'add-all-items':
            // add item data
            break;
    }
}

window.postMessage({
    type: 'CHEAT_REQUEST',
    action: 'addGroup',
    payload: {
        group: 'lobby-actions',
        actions: [
            { name: 'Action1', key: 'action-1' }
        ]
    }
} as CheatRequest, '*');

window.postMessage({
    type: 'CHEAT_REQUEST',
    action: 'removeGroup',
    payload: {
        group: 'lobby-actions'
    }
} as CheatRequest, '*');
```

## License

MIT
