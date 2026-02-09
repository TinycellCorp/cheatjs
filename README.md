# cheatjs

게임 엔진 독립적인 치트 UI (바텀시트)

**[Live Preview](https://tinycellcorp.github.io/cheatjs/)**

## 설치

```shell
npm install @TinycellCorp/cheatjs
```

> CDN 사용도 가능하지만, GitHub Packages 기반이라 별도 설정이 필요합니다.

## 빠른 시작

```typescript
// side-effect import로 전역 cheat 객체 등록
import "@TinycellCorp/cheatjs";

// 버튼 추가
cheat.add('버튼명', () => console.log('클릭!'));

// 그룹으로 정리
cheat.addGroup('Player', {
    'God Mode': () => player.invincible = true,
    'Add Gold': [() => player.gold += 1000, '골드 1000 추가']
});

// 상태라인 (버전/환경 표시)
cheat.statusline(opt => ['v1.0.0', 'dev']);
```

**UI 열기**: Shift+Click (데스크탑) / 트리플 탭 (모바일)

## API

### 기본

```javascript
cheat.show()              // UI 표시
cheat.hide()              // UI 숨김
cheat.toggle()            // 토글
```

### 명령어 관리

```javascript
// 명령어 추가
cheat.add(name, action)              // GLOBAL 그룹에 추가
cheat.add(name, action, groupKey)    // 특정 그룹에 추가
cheat.add(name, [action, desc])      // 설명 포함

// 삭제
cheat.remove(name)        // 명령어 삭제
cheat.clear()             // 전체 삭제
cheat.list()              // 목록 출력
```

### 그룹 관리

```javascript
// 그룹 추가
cheat.addGroup('그룹명', {
    '버튼1': () => {},
    '버튼2': [() => {}, '설명']
});

// 설명 포함 그룹
cheat.addGroup(['그룹명', '그룹 설명'], { ... });

// 그룹 삭제
cheat.removeGroup('그룹명');
```

### 상태라인

```javascript
// 기본 사용
cheat.statusline(opt => ['v1.0.0', 'dev']);
// → "v1.0.0 | dev"

// 구분자 변경
cheat.statusline(opt => {
    opt.separator = ' - ';
    return ['v1.0.0', 'dev'];
});

// 동적 값 갱신
cheat.statusline.refresh();
```

### 일괄 초기화 (선택)

`cheat()` 함수로 여러 명령어를 한번에 등록할 수 있습니다. 개별 API(`add`, `addGroup`)를 사용해도 되므로 필수는 아닙니다.

```javascript
// GLOBAL 그룹에 일괄 등록
cheat({
    '버튼1': () => {},
    '버튼2': [() => {}, '설명']
});

// 컨테이너 지정 (기본: document.body)
cheat({ ... }, document.getElementById('game'));
```

## 버튼 상태 제어

`add()` 콜백의 반환값으로 버튼 상태를 제어할 수 있습니다.

| 반환값 | 동작 |
|--------|------|
| `undefined` | 기본 (성공 피드백 후 복귀) |
| `true` | 토글 ON (파란 배경 유지) |
| `false` | 토글 OFF (기본 상태) |
| `'close'` | 성공 피드백 + 바텀시트 자동 닫기 |
| `{ backgroundColor: '...' }` | 커스텀 스타일 유지 |

```javascript
// 토글 버튼
var godMode = false;
cheat.add('무적', function() {
    godMode = !godMode;
    return godMode;  // true/false로 ON/OFF 표시
});

// 자동 닫기 (일회성 액션)
cheat.add('골드 추가', function() {
    addGold(1000);
    return 'close';  // 실행 후 바텀시트 닫힘
});

// 조건부 닫기
cheat.add('아이템 획득', function() {
    var ok = giveItem();
    return ok ? 'close' : undefined;  // 성공 시만 닫기
});

// 커스텀 색상 (단계별)
var level = 0;
var colors = ['', 'rgba(255,193,7,0.3)', 'rgba(255,152,0,0.3)'];
cheat.add('속도', function() {
    level = (level + 1) % 3;
    return level === 0 ? false : { backgroundColor: colors[level] };
});
```

허용 스타일: `backgroundColor`, `color`, `borderColor`, `borderWidth`, `borderStyle`, `opacity`, `boxShadow`, `outline`, `textDecoration`, `fontWeight`, `fontStyle`

## 셀렉트 버튼

드롭다운 선택형 버튼을 만들 수 있습니다.

```javascript
cheat.add('언어', {
    type: 'select',
    options: ['Korean', 'English', 'Japanese'],
    default: 'Korean',
    onChange: function(value, index) {
        console.log('선택:', value, index);
    },
    desc: '언어 변경'
});

// 그룹에서 일반 버튼과 혼합 사용
cheat.addGroup('Settings', {
    'Difficulty': {
        type: 'select',
        options: ['Easy', 'Normal', 'Hard'],
        default: 'Normal',
        onChange: function(value) { setDifficulty(value); }
    },
    'Reset All': function() { resetSettings(); }
});
```

| 속성 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `type` | `'select'` | O | 셀렉트 버튼 식별자 |
| `options` | `string[]` \| `() => string[]` | O | 선택지 목록 (배열 또는 함수) |
| `default` | `string` | | 초기 선택값 (미지정 시 첫 번째) |
| `onChange` | `(value, index) => void \| CheatButtonState` | | 값 변경 콜백 (반환값으로 상태 제어) |
| `desc` | `string` | | 버튼 설명 텍스트 |

### onChange 반환값

일반 버튼과 동일한 반환값을 지원합니다.

```javascript
// 선택 후 바텀시트 자동 닫기
cheat.add('서버', {
    type: 'select',
    options: ['서버1', '서버2'],
    onChange: function(value) {
        connectServer(value);
        return 'close';
    }
});

// 토글 스타일
cheat.add('모드', {
    type: 'select',
    options: ['OFF', 'ON'],
    onChange: function(value) {
        return value === 'ON';  // true: 파란 배경, false: 기본
    }
});

// 커스텀 스타일
cheat.add('위험도', {
    type: 'select',
    options: ['안전', '경고', '위험'],
    onChange: function(value) {
        if (value === '경고') return { backgroundColor: 'rgba(255,193,7,0.3)' };
        if (value === '위험') return { backgroundColor: 'rgba(244,67,54,0.3)' };
        return false;
    }
});
```

### 동적 옵션

`options`에 함수를 전달하면 팝업을 열 때마다 호출하여 옵션을 동적으로 생성합니다.

```javascript
cheat.add('서버 선택', {
    type: 'select',
    options: function() { return getAvailableServers(); },
    onChange: function(value) { connect(value); }
});
```

## 탭/드롭다운 모드

탭바 우측 토글 버튼으로 모드 전환 가능합니다.

| 모드 | 아이콘 | 설명 |
|------|--------|------|
| 탭 | ☰ | 가로 스크롤 탭 (드래그/스와이프) |
| 드롭다운 | ▦ | 셀렉터 방식 |

선택한 모드는 `localStorage`에 저장됩니다.

## 제스처

| 플랫폼 | 제스처 |
|--------|--------|
| 데스크탑 | Shift + Click |
| 모바일 | 트리플 탭 (같은 위치 3번) |

## 타입 지원

TypeScript 타입 정의(`cheat.d.ts`)가 포함되어 있습니다.

## 고급: postMessage API

iframe이나 웹뷰에서 `cheat` 객체에 직접 접근할 수 없을 때 사용합니다.

```typescript
// 초기화
window.postMessage({
    type: 'CHEAT_REQUEST',
    action: 'init',
    payload: {
        actions: [
            { name: '아이템 추가', key: 'add-item' }
        ]
    }
} as CheatRequest, '*');

// 이벤트 수신
window.addEventListener('message', function(e) {
    var data = e.data;
    if (data.type !== 'CHEAT_EVENT') return;
    if (data.event !== 'action_triggered') return;

    switch (data.payload.key) {
        case 'add-item':
            // 처리
            break;
    }
});

// 그룹 추가/삭제
window.postMessage({
    type: 'CHEAT_REQUEST',
    action: 'addGroup',
    payload: { group: 'lobby', actions: [...] }
}, '*');

window.postMessage({
    type: 'CHEAT_REQUEST',
    action: 'removeGroup',
    payload: { group: 'lobby' }
}, '*');
```

## License

MIT
