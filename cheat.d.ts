// ============================================================
// cheatjs TypeScript Type Definitions
// ============================================================

declare global {
    // ========================================================
    // 직접 호출 API 타입
    // ========================================================

    /** 허용되는 지속 스타일 속성 */
    interface CheatPersistentStyles {
        backgroundColor?: string;
        color?: string;
        borderColor?: string;
        borderWidth?: string;
        borderStyle?: string;
        opacity?: string;
        boxShadow?: string;
        outline?: string;
        textDecoration?: string;
        fontWeight?: string;
        fontStyle?: string;
    }

    /** 버튼 반환값: 지속 상태 제어 */
    type CheatButtonState = boolean | Partial<CheatPersistentStyles>;

    /** 액션: 함수 또는 [함수, 설명] 튜플 */
    type CheatAction =
        | (() => void | CheatButtonState)
        | [() => void | CheatButtonState, string];

    /** 액션맵: { '버튼명': 액션 } */
    type CheatActionMap = Record<string, CheatAction>;

    /** 그룹 정보: 문자열 또는 [이름, 설명] 튜플 */
    type CheatGroupInfo = string | [string, string];

    /** 내부 액션 데이터 구조 */
    interface CheatActionData {
        callback: () => void | CheatButtonState;
        desc: string | null;
        btn: HTMLButtonElement | null;
        group: string;
        persistentStyles: Partial<CheatPersistentStyles> | null;
    }

    /** 내부 그룹 데이터 구조 */
    interface CheatGroupData {
        desc: string | null;
        commands: string[];
        tab: HTMLButtonElement | null;
        content: HTMLDivElement | null;
        dropdownItem: HTMLButtonElement | null;
    }

    /** 상태라인 옵션 (향후 확장용) */
    interface StatuslineOptions {
        separator: string;  // 기본값: ' | '
    }

    /** 상태라인 콜백 타입 */
    type StatuslineCallback = (opt: StatuslineOptions) => (string | number | null | undefined)[];

    /** 상태라인 함수 인터페이스 */
    interface StatuslineFunction {
        (callback: StatuslineCallback): void;
        refresh(): void;
    }

    /** 메인 함수 + 메서드 인터페이스 */
    interface CheatFunction {
        (actionMap?: CheatActionMap, container?: HTMLElement): void;

        // UI 제어
        show(): void;
        hide(): void;
        toggle(): void;

        // 상태라인
        statusline: StatuslineFunction;

        // 명령어 관리
        add(name: string, action: CheatAction, groupKey?: string): void;
        remove(name: string): void;
        addGroup(groupInfo: CheatGroupInfo, actionMap: CheatActionMap): void;
        removeGroup(groupKey: string): void;
        clear(): void;
        list(): void;

        // 디버그 모드
        debug: boolean;

        // 내부 상태 (읽기 전용)
        readonly actions: Record<string, CheatActionData>;
        readonly groups: Record<string, CheatGroupData>;
    }

    // ========================================================
    // postMessage API 타입
    // ========================================================

    /** postMessage 액션 아이템 */
    interface CheatMessageAction {
        name: string;
        key: string;
        desc?: string;
    }

    /** init 요청 */
    interface CheatRequestInit {
        type: 'CHEAT_REQUEST';
        action: 'init';
        payload: {
            actions?: CheatMessageAction[];
        };
    }

    /** addGroup 요청 */
    interface CheatRequestAddGroup {
        type: 'CHEAT_REQUEST';
        action: 'addGroup';
        payload: {
            group: string | [string, string];
            actions: CheatMessageAction[];
        };
    }

    /** removeGroup 요청 */
    interface CheatRequestRemoveGroup {
        type: 'CHEAT_REQUEST';
        action: 'removeGroup';
        payload: { group: string };
    }

    /** clear 요청 */
    interface CheatRequestClear {
        type: 'CHEAT_REQUEST';
        action: 'clear';
        payload?: Record<string, never>;
    }

    /** 요청 메시지 유니온 타입 */
    type CheatRequest =
        | CheatRequestInit
        | CheatRequestAddGroup
        | CheatRequestRemoveGroup
        | CheatRequestClear;

    /** action_triggered 이벤트 */
    interface CheatEventActionTriggered {
        type: 'CHEAT_EVENT';
        event: 'action_triggered';
        payload: {
            key: string;
            name: string;
            group: string;
        };
    }

    /** 이벤트 메시지 유니온 타입 */
    type CheatEvent = CheatEventActionTriggered;

    // ========================================================
    // 전역 객체 선언
    // ========================================================

    interface Window {
        cheat: CheatFunction;
    }

    var cheat: CheatFunction;
}

// 모듈로 인식되도록 빈 export (isolatedModules 호환)
export {};
