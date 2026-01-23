# cheatjs

게임 엔진 독립적인 치트 UI (바텀시트)

## CDN

```html
<!-- 원본 (디버깅용) -->
<script src="https://cdn.jsdelivr.net/gh/TinycellCorp/cheatjs@v1.0.0/cheat.js"></script>

<!-- Minified (프로덕션용, 권장) -->
<script src="https://cdn.jsdelivr.net/gh/TinycellCorp/cheatjs@v1.0.0/cheat.min.js"></script>

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

cheat.add(name, action)   // 명령어 추가
cheat.remove(name)        // 명령어 삭제
cheat.clear()             // 전체 삭제

cheat.addGroup(name, map) // 그룹 추가
cheat.removeGroup(name)   // 그룹 삭제

cheat.list()              // 명령어 목록 출력
```

## License

MIT
