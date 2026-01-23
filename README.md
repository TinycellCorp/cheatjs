# cheatjs

게임 엔진 독립적인 치트 UI (바텀시트)

## CDN

```html
<!-- 원본 (디버깅용) -->
<script src="https://cdn.jsdelivr.net/gh/TinycellCorp/cheatjs@v1.1.0/cheat.js"></script>

<!-- Minified (프로덕션용, 권장) -->
<script src="https://cdn.jsdelivr.net/gh/TinycellCorp/cheatjs@v1.1.0/cheat.min.js"></script>

<!-- 최신 버전 -->
<script src="https://cdn.jsdelivr.net/gh/TinycellCorp/cheatjs@latest/cheat.min.js"></script>
```

## 사용법

```javascript
// 초기화 (버전 표시)
cheat('1.0.0', document.body);

// 초기화 + global 명령어
cheat('1.0.0', document.body, {
    '버튼명': () => console.log('클릭!')
});

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

cheat.add(name, action, groupKey?)  // 명령어 추가 (groupKey 생략 시 GLOBAL)
cheat.remove(name)                  // 명령어 삭제
cheat.clear()                       // 전체 삭제

cheat.addGroup(groupInfo, map)      // 그룹 추가 (groupInfo: string | [name, desc])
cheat.removeGroup(name)   // 그룹 삭제

cheat.list()              // 명령어 목록 출력
```

## 타입 지원

```shell
npm install -D @TinycellCorp/cheatjs-types
```

## postMessage

cheat객체의 의존성 제거를 위한 이벤트 기반 제어



```ts
// cheat('<version>', <dom>, <actions>)
// 내부에서 document.body 사용함.
window.postMessage({
    type: 'CHEAT_REQUEST',
    action: 'init',
    payload: {
        version: VERSION.semantic(),
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
