# cheatjs API Reference (v2.0.12)

## 통합 패턴

### import

```javascript
// side-effect import - window.cheat 전역 등록
require('@TinycellCorp/cheatjs');
// 또는
import '@TinycellCorp/cheatjs';
```

**주의:** `var cheat = require('@TinycellCorp/cheatjs')` 금지. module.exports가 없으므로 undefined가 반환됨. import 후 전역 `cheat` 객체를 직접 사용.

### 프로덕션 가드

cheat 객체가 없는 환경(프로덕션 빌드, 패키지 미설치 등)에서도 안전하게 동작하도록 가드 필수:

```javascript
// 권장 패턴
if (typeof cheat !== 'undefined') {
    cheat.addGroup(['Debug', '디버그'], {
        'God Mode': () => { player.invincible = !player.invincible; return player.invincible; },
        'Add Gold': [() => { player.gold += 1000; }, '골드 1000 추가']
    });

    cheat.statusline((opt) => ['v1.0.0', 'dev']);
}
```

### 코드 스타일

ES5 제약은 cheat.js **소스코드 개발에만** 해당. 통합 프로젝트에서는 프로젝트 스타일대로 자유롭게 작성:
- 화살표 함수 사용 가능
- let/const 사용 가능
- 템플릿 리터럴 사용 가능

---

## UI 제어

### `cheat.show()` / `cheat.hide()` / `cheat.toggle()`

바텀시트 UI를 표시/숨김/토글한다.

```javascript
cheat.show();    // 표시
cheat.hide();    // 숨김
cheat.toggle();  // 토글
```

### 제스처

자동으로 등록되는 제스처:

| 환경 | 제스처 |
|------|--------|
| 데스크탑 | Shift + 클릭 |
| 모바일 | 같은 위치에서 트리플 탭 (350ms 내, 반경 20px) |

---

## 커맨드 추가

### `cheat.add(name, action, groupKey?)`

단일 커맨드를 추가한다.

**파라미터:**

| 이름 | 타입 | 설명 |
|------|------|------|
| `name` | `string` | 버튼 표시 이름 |
| `action` | `Function \| [Function, string] \| CheatSelectConfig` | 액션 (아래 3가지 형식) |
| `groupKey` | `string` (선택) | 그룹 키. 기본값: `'GLOBAL'` |

**형식 1: 함수만**

```javascript
cheat.add('Button', () => console.log('clicked'));
```

**형식 2: [함수, 설명] 튜플**

```javascript
cheat.add('Add Gold', [() => { player.gold += 1000; }, '골드 1000 추가']);
```

**형식 3: 셀렉트 설정** (→ 셀렉트 섹션 참조)

```javascript
cheat.add('Language', {
    type: 'select',
    options: ['Korean', 'English'],
    default: 'Korean',
    onChange: (value, index) => { setLang(value); },
    desc: '언어 변경'
});
```

**그룹 지정:**

```javascript
cheat.add('God Mode', () => { ... }, 'Player');
```

---

## 그룹

### `cheat.addGroup(groupInfo, actionMap)`

그룹과 여러 커맨드를 한 번에 추가한다.

**파라미터:**

| 이름 | 타입 | 설명 |
|------|------|------|
| `groupInfo` | `string \| [string, string]` | 그룹명 또는 `[그룹명, 설명]` 튜플 |
| `actionMap` | `Record<string, CheatAction>` | 커맨드 맵 |

```javascript
// 그룹명만
cheat.addGroup('Player', {
    'God Mode': () => { player.invincible = !player.invincible; return player.invincible; },
    'Add Gold': [() => { player.gold += 1000; }, '골드 1000 추가']
});

// [그룹명, 설명] 튜플
cheat.addGroup(['Player', '플레이어 설정'], {
    'God Mode': () => { ... }
});
```

### `cheat.removeGroup(groupKey)`

그룹과 소속 커맨드를 모두 제거한다.

```javascript
cheat.removeGroup('Player');
```

---

## 셀렉트

### CheatSelectConfig

드롭다운 선택 버튼을 만든다.

```typescript
interface CheatSelectConfig {
    type: 'select';                              // 필수
    options: string[] | (() => string[]);        // 정적 배열 또는 동적 함수
    default?: string;                            // 초기 선택값
    onChange?: (value: string, index: number) => void | CheatButtonState;
    desc?: string;                               // 버튼 설명
}
```

**정적 옵션:**

```javascript
cheat.add('Difficulty', {
    type: 'select',
    options: ['Easy', 'Normal', 'Hard'],
    default: 'Normal',
    onChange: (value) => setDifficulty(value),
    desc: '게임 난이도'
});
```

**동적 옵션** (팝업 열릴 때마다 호출):

```javascript
cheat.add('Server', {
    type: 'select',
    options: () => getAvailableServers(),
    onChange: (value) => connectServer(value)
});
```

**onChange 반환값으로 상태 제어:**

일반 버튼과 동일한 반환값(true/false/'close'/커스텀 스타일)을 지원한다.

```javascript
// 선택 후 바텀시트 자동 닫기
cheat.add('서버', {
    type: 'select',
    options: ['서버1', '서버2'],
    onChange: (value) => {
        connectServer(value);
        return 'close';
    }
});

// 토글 스타일
cheat.add('모드', {
    type: 'select',
    options: ['OFF', 'ON'],
    onChange: (value) => {
        setMode(value === 'ON');
        return value === 'ON';  // true = 파란색, false = 기본
    }
});

// 커스텀 스타일
cheat.add('위험도', {
    type: 'select',
    options: ['안전', '경고', '위험'],
    onChange: (value) => {
        if (value === '경고') return { backgroundColor: 'rgba(255,193,7,0.3)' };
        if (value === '위험') return { backgroundColor: 'rgba(244,67,54,0.3)' };
        return false;
    }
});
```

**주의:** 기본값 프로퍼티는 `default`이다. `defaultValue`가 아님.

---

## 반환값 제어

커맨드 함수의 반환값으로 버튼 상태를 제어한다.

| 반환값 | 효과 |
|--------|------|
| `undefined` (반환 없음) | 녹색 피드백 (200ms) 후 기본 상태 복귀 |
| `true` | 토글 ON - 파란색 배경 유지 |
| `false` | 토글 OFF - 기본 상태 복귀 |
| `'close'` | 녹색 피드백 + 바텀시트 자동 닫기 (300ms) |
| `'문자열'` | 녹색 피드백 + 마퀴 토스트 (바텀시트 상단에 텍스트 슬라이드, 3초) |
| `{ backgroundColor: '...' }` | 커스텀 스타일 유지 |

**토글 패턴:**

```javascript
let godMode = false;
cheat.add('God Mode', () => {
    godMode = !godMode;
    player.invincible = godMode;
    return godMode;  // true = 파란색 ON, false = 기본 OFF
});
```

**자동 닫기 패턴:**

```javascript
cheat.add('Add Item', () => {
    inventory.addItem('potion');
    return 'close';
});
```

**커스텀 스타일:**

```javascript
let level = 0;
const colors = ['', 'rgba(255,193,7,0.3)', 'rgba(255,152,0,0.3)'];
cheat.add('Power', () => {
    level = (level + 1) % 3;
    return level === 0 ? false : { backgroundColor: colors[level] };
});
```

**토스트 패턴:**

```javascript
cheat.add('골드 추가', () => {
    player.gold += 1000;
    return '골드 1000 추가 완료';  // 바텀시트 상단에 마퀴 텍스트 표시
});
```

**허용 스타일 속성:** `backgroundColor`, `color`, `borderColor`, `borderWidth`, `borderStyle`, `opacity`, `boxShadow`, `outline`, `textDecoration`, `fontWeight`, `fontStyle`

---

## 상태라인

### `cheat.statusline(callback)`

바텀시트 상단에 버전/환경 정보를 표시한다.

```javascript
cheat.statusline((opt) => {
    return ['v1.0.0', 'dev', 'build: 2025-02-12'];
});
// 출력: "v1.0.0 | dev | build: 2025-02-12"
```

**파라미터:**

| 이름 | 타입 | 설명 |
|------|------|------|
| `callback` | `(opt: StatuslineOptions) => (string \| number \| null \| undefined)[]` | 표시할 값 배열 반환. null/undefined는 자동 필터링 |

**StatuslineOptions:**

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `separator` | `string` | `' \| '` | 값 사이 구분자 |

**커스텀 구분자:**

```javascript
cheat.statusline((opt) => {
    opt.separator = ' - ';
    return ['v1.0.0', 'dev'];
});
// 출력: "v1.0.0 - dev"
```

### `cheat.statusline.refresh()`

상태라인을 수동 갱신한다 (콜백 재호출).

```javascript
cheat.statusline.refresh();
```

---

## 삭제

### `cheat.remove(name)`

단일 커맨드를 제거한다. 빈 비-GLOBAL 그룹은 자동 삭제.

```javascript
cheat.remove('God Mode');
```

### `cheat.removeGroup(groupKey)`

그룹과 소속 커맨드를 모두 제거한다.

```javascript
cheat.removeGroup('Player');
```

### `cheat.clear()`

모든 커맨드와 그룹을 제거하고 초기 상태로 리셋한다.

```javascript
cheat.clear();
```

---

## 기타

### `cheat.debug`

디버그 로깅 활성화/비활성화.

```javascript
cheat.debug = true;   // 활성화
cheat.debug = false;  // 비활성화
```

### `cheat.list()`

등록된 커맨드 트리를 콘솔에 출력한다 (debug=true 필요).

```javascript
cheat.debug = true;
cheat.list();
// [GLOBAL]
//   - Button: 설명
// [Player]
//   - God Mode
//   - Add Gold: 골드 1000 추가
```

### `cheat.actions` (읽기 전용)

등록된 모든 커맨드의 얕은 복사본.

```javascript
const snapshot = cheat.actions;
// { 'God Mode': { callback, desc, btn, group, persistentStyles, ... }, ... }
```

### `cheat.groups` (읽기 전용)

등록된 모든 그룹의 얕은 복사본.

```javascript
const snapshot = cheat.groups;
// { 'GLOBAL': { desc, commands: [...], tab, content, dropdownItem }, ... }
```

### `cheat(actionMap?, container?)` - 일괄 초기화 (선택)

GLOBAL 그룹에 여러 커맨드를 한번에 등록한다. `add()`, `addGroup()`으로 개별 추가해도 되므로 **필수가 아니다.**

```javascript
// GLOBAL 그룹에 일괄 등록
cheat({
    'Button': () => console.log('clicked'),
    'Add Gold': [() => { player.gold += 1000; }, '골드 1000 추가']
});

// 컨테이너 지정 (기본: document.body)
cheat({ ... }, document.getElementById('game'));
```

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `actionMap` | `Record<string, CheatAction>` (선택) | GLOBAL 그룹에 추가할 커맨드 맵 |
| `container` | `HTMLElement` (선택) | UI가 삽입될 DOM 컨테이너. 기본값: `document.body` |
