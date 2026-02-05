/** @version 2.0.7 */


























/**
 * Cheat Utility - 게임 엔진 독립적인 치트 UI (바텀시트)
 *
 * 사용법:
 *   cheat();                                          - 초기화
 *   cheat({ '버튼명': () => {} });                     - 초기화 + global 명령어
 *   cheat({ '버튼명': () => {} }, document.body);      - 초기화 + global 명령어 + 컨테이너
 *
 * 활성화 (토글):
 *   - 데스크탑: Shift+Click
 *   - 모바일: 트리플 탭 (3번 연속 탭)
 *
 * API:
 *   window.cheat.show()   - UI 표시
 *   window.cheat.hide()   - UI 숨김
 *   window.cheat.toggle() - 토글
 *
 *   // 상태라인 (버전/환경 정보 표시)
 *   window.cheat.statusline(opt => ['v1.0.0', 'hi5']); - 상태라인 설정
 *   window.cheat.statusline.refresh();                 - 상태라인 갱신
 *
 *   // 동적 추가/삭제
 *   window.cheat.add(name, action)                    - 명령어 추가 (action: 함수 또는 [함수, 설명])
 *   window.cheat.remove(name)                         - 명령어 삭제
 *   window.cheat.clear()                              - 전체 삭제
 *
 *   // 그룹 지원
 *   window.cheat.addGroup(groupInfo, actionMap)       - 그룹 추가 (groupInfo: 문자열 또는 [이름, 설명])
 *   window.cheat.removeGroup(groupKey)               - 그룹 삭제
 *
 *   window.cheat.list()   - 명령어 트리 출력
 *
 *   // 디버그 모드
 *   window.cheat.debug = true;  - 디버그 로그 활성화
 *   window.cheat.debug = false; - 디버그 로그 비활성화 (기본값)
 */
(function () {
    'use strict';

    var ui = null;
    var isVisible = false;
    var isAnimating = false; // 애니메이션 중 플래그
    var actions = {};      // name → { callback, desc, btn, group }
    var groups = {};       // groupKey → { desc, commands: [], container, expanded }
    var container = null;
    var statuslineCallback = null; // 상태라인 콜백 함수
    var GLOBAL_GROUP = 'GLOBAL';
    var debugMode = false; // 디버그 로그 출력 여부
    var tabMode = 'tab'; // 'tab' | 'dropdown'
    var dropdownOpen = false; // 드롭다운 메뉴 열림 상태

    // 디버그 로그 헬퍼
    function log() {
        if (debugMode) console.log.apply(console, arguments);
    }

    // document 레벨 이벤트 핸들러 참조 (정리용)
    var docMouseMoveHandler = null;
    var docMouseUpHandler = null;
    var listenersRegistered = false;

    // 스타일 정의
    var STYLES = {
        overlay: {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: '99998',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        },
        bottomSheet: {
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            minHeight: '50vh',
            maxHeight: '50vh',
            backgroundColor: 'rgba(32, 32, 32, 0.95)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            color: '#fff',
            zIndex: '99999',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
            userSelect: 'none',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            transform: 'translateY(100%)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            touchAction: 'none',
            overscrollBehavior: 'contain',
            paddingBottom: 'env(safe-area-inset-bottom)'
        },
        dragHandle: {
            position: 'relative',
            padding: '12px',
            cursor: 'grab',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: '0'
        },
        dragBar: {
            width: '40px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '2px'
        },
        statusline: {
            padding: '8px 16px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            cursor: 'pointer',
            flexShrink: '0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        },
        content: {
            flex: '1',
            overflowY: 'auto',
            padding: '0 16px 16px 16px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y'
        },
        tabBar: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            overflowX: 'auto',
            flex: '1',
            minWidth: '0',
            touchAction: 'pan-x'
        },
        tab: {
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '20px',
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.2s, color 0.2s'
        },
        tabContent: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            padding: '12px 0'
        },
        actionBtn: {
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'center',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            height: '56px',
            touchAction: 'manipulation'
        },
        actionBtnName: {
            fontSize: '13px',
            fontWeight: '500'
        },
        actionBtnDesc: {
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.2'
        },
        tabBarWrapper: {
            display: 'flex',
            alignItems: 'center',
            flexShrink: '0',
            height: '56px',
            boxSizing: 'border-box',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        },
        tabModeToggle: {
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '16px',
            padding: '8px 16px',
            cursor: 'pointer',
            flexShrink: '0',
            lineHeight: '1'
        },
        dropdown: {
            flex: '1',
            position: 'relative',
            padding: '12px 0 12px 16px'
        },
        dropdownTrigger: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            boxSizing: 'border-box'
        },
        dropdownMenu: {
            position: 'absolute',
            top: '100%',
            left: '16px',
            right: '0',
            backgroundColor: 'rgba(40, 40, 40, 0.98)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: '10',
            overflow: 'hidden',
            display: 'none'
        },
        dropdownItem: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '10px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
            boxSizing: 'border-box'
        },
        dropdownItemActive: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontWeight: '500'
        }
    };

    // 스타일 객체를 element에 적용
    function applyStyles(el, styles) {
        for (var key in styles) {
            el.style[key] = styles[key];
        }
    }

    // 지속 스타일 허용 속성 (레이아웃 영향 없는 속성만)
    var ALLOWED_PERSISTENT_STYLES = [
        'backgroundColor', 'color', 'borderColor', 'borderWidth', 'borderStyle',
        'opacity', 'boxShadow', 'outline', 'textDecoration', 'fontWeight', 'fontStyle'
    ];

    // 토글 ON 기본 스타일
    var TOGGLE_ON_STYLES = {
        backgroundColor: 'rgba(76, 175, 80, 0.3)'
    };

    // 콜백 반환값을 지속 스타일 객체로 변환
    function resolveReturnValue(result) {
        if (result === undefined || result === null) return undefined;
        if (result === true) return TOGGLE_ON_STYLES;
        if (result === false) return null;
        if (typeof result === 'object') {
            var filtered = {};
            var hasProps = false;
            for (var i = 0; i < ALLOWED_PERSISTENT_STYLES.length; i++) {
                var prop = ALLOWED_PERSISTENT_STYLES[i];
                if (result.hasOwnProperty(prop)) {
                    filtered[prop] = result[prop];
                    hasProps = true;
                }
            }
            return hasProps ? filtered : undefined;
        }
        return undefined;
    }

    // 버튼에 기본 스타일 + 지속 스타일 적용
    function applyPersistentStyles(btn, persistentStyles) {
        for (var i = 0; i < ALLOWED_PERSISTENT_STYLES.length; i++) {
            btn.style[ALLOWED_PERSISTENT_STYLES[i]] = '';
        }
        btn.style.backgroundColor = STYLES.actionBtn.backgroundColor;
        btn.style.color = STYLES.actionBtn.color;
        btn.style.border = 'none';
        if (persistentStyles) {
            for (var key in persistentStyles) {
                if (persistentStyles.hasOwnProperty(key)) {
                    btn.style[key] = persistentStyles[key];
                }
            }
        }
    }

    // 버튼 요소로 actionData 찾기
    function findActionByBtn(btn) {
        for (var name in actions) {
            if (actions.hasOwnProperty(name) && actions[name].btn === btn) {
                return actions[name];
            }
        }
        return null;
    }

    // 스크롤바 스타일 주입
    function injectScrollbarStyles() {
        if (document.getElementById('cheat-scrollbar-style')) return;

        var style = document.createElement('style');
        style.id = 'cheat-scrollbar-style';
        style.textContent = [
            '#cheat-content::-webkit-scrollbar {',
            '  width: 6px;',
            '}',
            '#cheat-content::-webkit-scrollbar-track {',
            '  background: transparent;',
            '}',
            '#cheat-content::-webkit-scrollbar-thumb {',
            '  background: rgba(255, 255, 255, 0.3);',
            '  border-radius: 3px;',
            '}',
            '#cheat-content::-webkit-scrollbar-thumb:hover {',
            '  background: rgba(255, 255, 255, 0.5);',
            '}',
            '#cheat-content {',
            '  scrollbar-width: thin;',
            '  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;',
            '}',
            '#cheat-tabbar {',
            '  scrollbar-width: none;',
            '  -ms-overflow-style: none;',
            '}',
            '#cheat-tabbar::-webkit-scrollbar {',
            '  display: none;',
            '}',
            '#cheat-bottomsheet button {',
            '  outline: none !important;',
            '  -webkit-tap-highlight-color: transparent;',
            '}',
            '#cheat-bottomsheet button:active {',
            '  opacity: 0.8;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    // UI 생성
    function createUI() {
        injectScrollbarStyles();
        if (ui) return ui;

        // 오버레이
        var overlay = document.createElement('div');
        overlay.id = 'cheat-overlay';
        applyStyles(overlay, STYLES.overlay);
        overlay.onclick = function () {
            hide();
        };

        // 오버레이 터치 시 뒷 화면 스크롤 방지
        overlay.addEventListener('touchmove', function (e) {
            e.preventDefault();
        }, { passive: false });

        // 바텀시트
        var bottomSheet = document.createElement('div');
        bottomSheet.id = 'cheat-bottomsheet';
        applyStyles(bottomSheet, STYLES.bottomSheet);

        // 드래그 핸들
        var dragHandle = document.createElement('div');
        applyStyles(dragHandle, STYLES.dragHandle);

        var dragBar = document.createElement('div');
        applyStyles(dragBar, STYLES.dragBar);
        dragHandle.appendChild(dragBar);

        bottomSheet.appendChild(dragHandle);

        // 상태라인
        var statuslineEl = document.createElement('div');
        applyStyles(statuslineEl, STYLES.statusline);
        statuslineEl.id = 'cheat-statusline';

        // 탭/클릭 시 새로고침
        statuslineEl.addEventListener('click', function(e) {
            e.stopPropagation();
            updateStatuslineUI();
        });

        // 내용 없으면 숨김
        if (!statuslineCallback) {
            statuslineEl.style.display = 'none';
        }

        bottomSheet.appendChild(statuslineEl);

        // 스와이프로 닫기 (터치 + 마우스)
        var startY = 0;
        var currentY = 0;
        var isDragging = false;

        function onDragStart(y) {
            startY = y;
            currentY = y;
            isDragging = true;
            bottomSheet.style.transition = 'none';
        }

        function onDragMove(y) {
            if (!isDragging) return;
            currentY = y;
            var deltaY = currentY - startY;
            if (deltaY > 0) {
                bottomSheet.style.transform = 'translateY(' + deltaY + 'px)';
            }
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            bottomSheet.style.transition = 'transform 0.3s ease';
            var deltaY = currentY - startY;
            if (deltaY > 80) {
                hide();
            } else {
                bottomSheet.style.transform = 'translateY(0)';
            }
        }

        // 터치 이벤트
        dragHandle.addEventListener('touchstart', function (e) {
            onDragStart(e.touches[0].clientY);
        }, { passive: true });

        dragHandle.addEventListener('touchmove', function (e) {
            e.preventDefault(); // 크롬 pull-to-refresh 방지
            onDragMove(e.touches[0].clientY);
        }, { passive: false });

        dragHandle.addEventListener('touchend', onDragEnd);

        // 마우스 이벤트
        dragHandle.addEventListener('mousedown', function (e) {
            onDragStart(e.clientY);
            e.preventDefault();
        });

        // document 레벨 핸들러 (정리 가능하도록 참조 저장)
        docMouseMoveHandler = function (e) {
            if (isDragging) onDragMove(e.clientY);
        };
        docMouseUpHandler = onDragEnd;

        registerDocumentListeners();

        // localStorage에서 탭 모드 로드
        var savedMode = null;
        try { savedMode = localStorage.getItem('cheat-tab-mode'); } catch (e) {}
        if (savedMode === 'tab' || savedMode === 'dropdown') {
            tabMode = savedMode;
        }

        // 탭바 래퍼
        var tabBarWrapper = document.createElement('div');
        tabBarWrapper.id = 'cheat-tabbar-wrapper';
        applyStyles(tabBarWrapper, STYLES.tabBarWrapper);

        // 탭바
        var tabBar = document.createElement('div');
        tabBar.id = 'cheat-tabbar';
        applyStyles(tabBar, STYLES.tabBar);
        tabBarWrapper.appendChild(tabBar);

        // 커스텀 드롭다운
        var dropdownEl = document.createElement('div');
        applyStyles(dropdownEl, STYLES.dropdown);

        var dropdownTrigger = document.createElement('button');
        applyStyles(dropdownTrigger, STYLES.dropdownTrigger);
        dropdownTrigger.textContent = '-';
        dropdownTrigger.onclick = function () {
            toggleDropdownMenu();
        };
        dropdownEl.appendChild(dropdownTrigger);

        var dropdownMenu = document.createElement('div');
        applyStyles(dropdownMenu, STYLES.dropdownMenu);
        dropdownEl.appendChild(dropdownMenu);

        tabBarWrapper.appendChild(dropdownEl);

        // 토글 버튼
        var toggleBtn = document.createElement('button');
        applyStyles(toggleBtn, STYLES.tabModeToggle);
        toggleBtn.textContent = tabMode === 'tab' ? '☰' : '▦';
        toggleBtn.title = tabMode === 'tab' ? '드롭다운으로 전환' : '탭으로 전환';
        toggleBtn.onclick = function () {
            setTabMode(tabMode === 'tab' ? 'dropdown' : 'tab');
        };
        tabBarWrapper.appendChild(toggleBtn);

        // 현재 모드에 따라 표시/숨김
        tabBar.style.display = tabMode === 'tab' ? 'flex' : 'none';
        dropdownEl.style.display = tabMode === 'dropdown' ? 'block' : 'none';

        // 드롭다운 외부 클릭 시 닫기
        bottomSheet.addEventListener('click', function (e) {
            if (!dropdownOpen) return;
            // 드롭다운 영역 내 클릭이 아닌 경우 닫기
            var target = e.target;
            var isInDropdown = false;
            while (target && target !== bottomSheet) {
                if (target === dropdownEl) {
                    isInDropdown = true;
                    break;
                }
                target = target.parentNode;
            }
            if (!isInDropdown) {
                closeDropdownMenu();
            }
        });

        bottomSheet.appendChild(tabBarWrapper);

        // 컨텐츠 영역
        var content = document.createElement('div');
        content.id = 'cheat-content';
        applyStyles(content, STYLES.content);
        bottomSheet.appendChild(content);

        // 터치 시작 시 위치 초기화
        bottomSheet.addEventListener('touchstart', function (e) {
            content._lastTouchY = e.touches[0].clientY;
        }, { passive: true });

        // 바텀시트 터치 시 pull-to-refresh 및 뒷 화면 스크롤 방지
        bottomSheet.addEventListener('touchmove', function (e) {
            var target = e.target;
            var isScrollable = false;

            // 스크롤 가능한 컨텐츠 영역인지 확인
            while (target && target !== bottomSheet) {
                if (target === content && content.scrollHeight > content.clientHeight) {
                    isScrollable = true;
                    break;
                }
                target = target.parentNode;
            }

            if (isScrollable) {
                // 컨텐츠 영역: 스크롤 끝에서만 방지
                var scrollTop = content.scrollTop;
                var scrollHeight = content.scrollHeight;
                var clientHeight = content.clientHeight;
                var isAtTop = scrollTop <= 0;
                var isAtBottom = scrollTop + clientHeight >= scrollHeight;

                // 터치 방향 감지
                if (!content._lastTouchY) content._lastTouchY = e.touches[0].clientY;
                var touchY = e.touches[0].clientY;
                var isScrollingUp = touchY > content._lastTouchY;
                var isScrollingDown = touchY < content._lastTouchY;
                content._lastTouchY = touchY;

                // 스크롤 끝에서 더 스크롤하려 하면 방지
                if ((isAtTop && isScrollingUp) || (isAtBottom && isScrollingDown)) {
                    e.preventDefault();
                }
            } else {
                // 컨텐츠 외 영역: 항상 방지
                e.preventDefault();
            }

            e.stopPropagation();
        }, { passive: false });

        ui = {
            overlay: overlay,
            bottomSheet: bottomSheet,
            dragHandle: dragHandle,
            tabBarWrapper: tabBarWrapper,
            tabBar: tabBar,
            dropdownEl: dropdownEl,
            dropdownTrigger: dropdownTrigger,
            dropdownMenu: dropdownMenu,
            toggleBtn: toggleBtn,
            content: content,
            activeTab: null
        };

        return ui;
    }

    // document 레벨 리스너 등록 헬퍼
    function registerDocumentListeners() {
        if (listenersRegistered || !docMouseMoveHandler) return;
        document.addEventListener('mousemove', docMouseMoveHandler);
        document.addEventListener('mouseup', docMouseUpHandler);
        listenersRegistered = true;
    }

    // 탭/드롭다운 모드 전환
    function setTabMode(mode) {
        tabMode = mode;
        try { localStorage.setItem('cheat-tab-mode', mode); } catch (e) {}

        if (!ui) return;

        if (mode === 'tab') {
            ui.tabBar.style.display = 'flex';
            ui.dropdownEl.style.display = 'none';
            ui.toggleBtn.textContent = '☰';
            ui.toggleBtn.title = '드롭다운으로 전환';
        } else {
            ui.tabBar.style.display = 'none';
            ui.dropdownEl.style.display = 'block';
            ui.toggleBtn.textContent = '▦';
            ui.toggleBtn.title = '탭으로 전환';
            updateDropdownTrigger();
        }

        // 드롭다운 메뉴 닫기
        closeDropdownMenu();
    }

    // 드롭다운 트리거 텍스트 업데이트
    function updateDropdownTrigger() {
        if (!ui || !ui.dropdownTrigger) return;
        var label = ui.activeTab || '-';
        var arrow = dropdownOpen ? ' \u25B4' : ' \u25BE';
        ui.dropdownTrigger.textContent = label + arrow;
    }

    // 드롭다운 메뉴 열기/닫기 토글
    function toggleDropdownMenu() {
        if (dropdownOpen) {
            closeDropdownMenu();
        } else {
            openDropdownMenu();
        }
    }

    // 드롭다운 메뉴 열기
    function openDropdownMenu() {
        if (!ui || !ui.dropdownMenu) return;
        dropdownOpen = true;
        ui.dropdownMenu.style.display = 'block';
        updateDropdownTrigger();
    }

    // 드롭다운 메뉴 닫기
    function closeDropdownMenu() {
        if (!ui || !ui.dropdownMenu) return;
        dropdownOpen = false;
        ui.dropdownMenu.style.display = 'none';
        updateDropdownTrigger();
    }

    // 드롭다운 아이템 활성 상태 업데이트
    function updateDropdownItemsActive() {
        if (!ui) return;
        for (var key in groups) {
            if (groups[key].dropdownItem) {
                if (key === ui.activeTab) {
                    applyStyles(groups[key].dropdownItem, STYLES.dropdownItem);
                    applyStyles(groups[key].dropdownItem, STYLES.dropdownItemActive);
                } else {
                    applyStyles(groups[key].dropdownItem, STYLES.dropdownItem);
                }
            }
        }
    }

    // 탭 선택
    function selectTab(groupKey) {
        if (!ui) return;

        // 모든 탭 비활성화
        var tabs = ui.tabBar.querySelectorAll('button');
        tabs.forEach(function (tab) {
            tab.style.backgroundColor = 'transparent';
            tab.style.color = 'rgba(255, 255, 255, 0.45)';
        });

        // 모든 컨텐츠 숨김
        for (var key in groups) {
            if (groups[key].content) {
                groups[key].content.style.display = 'none';
            }
        }

        // 선택된 탭 활성화
        if (groups[groupKey]) {
            if (groups[groupKey].tab) {
                groups[groupKey].tab.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                groups[groupKey].tab.style.color = '#fff';
            }
            if (groups[groupKey].content) {
                groups[groupKey].content.style.display = 'grid';
            }
        }

        ui.activeTab = groupKey;

        // 드롭다운 트리거 텍스트 및 아이템 활성 상태 업데이트
        updateDropdownTrigger();
        updateDropdownItemsActive();
        closeDropdownMenu();
    }

    // 그룹(탭) 컨테이너 생성
    function createGroupContainer(groupKey, groupDesc) {
        // 탭 버튼 생성
        var tab = document.createElement('button');
        applyStyles(tab, STYLES.tab);
        tab.textContent = groupKey;
        tab.onclick = function () {
            selectTab(groupKey);
        };

        // 컨텐츠 영역 생성
        var contentDiv = document.createElement('div');
        applyStyles(contentDiv, STYLES.tabContent);
        contentDiv.style.display = 'none'; // 기본 숨김

        // 드롭다운 아이템 생성
        var dropdownItem = document.createElement('button');
        applyStyles(dropdownItem, STYLES.dropdownItem);
        dropdownItem.textContent = groupKey;
        dropdownItem.onclick = function () {
            selectTab(groupKey);
        };
        dropdownItem.onmouseenter = function () {
            var isActive = ui && ui.activeTab === groupKey;
            if (!isActive) {
                dropdownItem.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                dropdownItem.style.color = '#fff';
            }
        };
        dropdownItem.onmouseleave = function () {
            var isActive = ui && ui.activeTab === groupKey;
            if (isActive) {
                applyStyles(dropdownItem, STYLES.dropdownItemActive);
            } else {
                dropdownItem.style.backgroundColor = 'transparent';
                dropdownItem.style.color = STYLES.dropdownItem.color;
            }
        };

        return {
            tab: tab,
            content: contentDiv,
            dropdownItem: dropdownItem
        };
    }

    // 그룹 컨테이너 가져오기 (없으면 생성)
    function getOrCreateGroupContainer(groupKey, groupDesc) {
        if (!groups[groupKey]) {
            groups[groupKey] = {
                desc: groupDesc || null,
                commands: [],
                tab: null,
                content: null,
                dropdownItem: null
            };
        }

        if (!groups[groupKey].tab && ui) {
            var groupUI = createGroupContainer(groupKey, groups[groupKey].desc);
            groups[groupKey].tab = groupUI.tab;
            groups[groupKey].content = groupUI.content;
            groups[groupKey].dropdownItem = groupUI.dropdownItem;
            ui.tabBar.appendChild(groupUI.tab);
            ui.content.appendChild(groupUI.content);
            ui.dropdownMenu.appendChild(groupUI.dropdownItem);

            // 첫 번째 탭이면 자동 선택
            if (!ui.activeTab) {
                selectTab(groupKey);
            }
        }

        return groups[groupKey];
    }

    // 액션 버튼 추가 (버튼 요소 반환)
    function addActionButton(name, callback, desc, groupKey) {
        var group = getOrCreateGroupContainer(groupKey);
        if (!group || !group.content) return null;

        var btn = document.createElement('button');
        applyStyles(btn, STYLES.actionBtn);

        // 이름
        var nameSpan = document.createElement('span');
        applyStyles(nameSpan, STYLES.actionBtnName);
        nameSpan.textContent = name;
        btn.appendChild(nameSpan);

        // 설명 (있을 경우)
        if (desc) {
            var descSpan = document.createElement('span');
            applyStyles(descSpan, STYLES.actionBtnDesc);
            descSpan.textContent = desc;
            btn.appendChild(descSpan);
        }

        var feedbackTimer = null;

        btn.onclick = function () {
            if (feedbackTimer) {
                clearTimeout(feedbackTimer);
                feedbackTimer = null;
            }

            try {
                var result = callback();
                var resolved = resolveReturnValue(result);

                // 지속 상태 업데이트
                if (resolved !== undefined) {
                    var actionData = findActionByBtn(btn);
                    if (actionData) {
                        actionData.persistentStyles = resolved;
                    }
                }

                // 성공 피드백
                btn.style.backgroundColor = 'rgba(76, 175, 80, 0.4)';
                feedbackTimer = setTimeout(function () {
                    feedbackTimer = null;
                    var actionData = findActionByBtn(btn);
                    var persistent = actionData ? actionData.persistentStyles : null;
                    applyPersistentStyles(btn, persistent);
                }, 200);
            } catch (e) {
                console.error('[Cheat] 액션 오류:', e);
                btn.style.backgroundColor = 'rgba(244, 67, 54, 0.4)';
                feedbackTimer = setTimeout(function () {
                    feedbackTimer = null;
                    var actionData = findActionByBtn(btn);
                    var persistent = actionData ? actionData.persistentStyles : null;
                    applyPersistentStyles(btn, persistent);
                }, 200);
            }
        };

        // 호버 효과
        btn.onmouseenter = function () {
            var actionData = findActionByBtn(btn);
            var persistent = actionData ? actionData.persistentStyles : null;
            if (!persistent || !persistent.backgroundColor) {
                btn.style.backgroundColor = 'rgba(255, 255, 255, 0.10)';
            }
        };
        btn.onmouseleave = function () {
            var actionData = findActionByBtn(btn);
            var persistent = actionData ? actionData.persistentStyles : null;
            applyPersistentStyles(btn, persistent);
        };

        group.content.appendChild(btn);
        return btn;
    }

    // 버튼 제거
    function removeActionButton(btn) {
        if (btn && btn.parentNode) {
            btn.parentNode.removeChild(btn);
        }
    }

    // UI 표시
    function show() {
        if (!ui) createUI();
        // hide 후 재표시 시 리스너 재등록
        registerDocumentListeners();

        // UI 생성 전에 등록된 액션들의 버튼 소급 생성
        for (var name in actions) {
            if (actions.hasOwnProperty(name) && !actions[name].btn) {
                var a = actions[name];
                var btn = addActionButton(name, a.callback, a.desc, a.group);
                a.btn = btn;
            }
        }

        // activeTab이 유효하지 않으면 첫 번째 탭으로 전환
        if (!ui.activeTab || !groups[ui.activeTab]) {
            var firstGroup = Object.keys(groups)[0];
            if (firstGroup) {
                selectTab(firstGroup);
            }
        }

        var target = container || document.body;
        if (!ui.overlay.parentNode && target) {
            target.appendChild(ui.overlay);
            target.appendChild(ui.bottomSheet);
        }

        // 상태라인 갱신 (DOM append 후에 호출)
        updateStatuslineUI();

        // 애니메이션 시작
        isAnimating = true;

        // 클릭 활성화
        ui.overlay.style.pointerEvents = 'auto';
        ui.bottomSheet.style.pointerEvents = 'auto';

        // 애니메이션
        requestAnimationFrame(function () {
            ui.overlay.style.opacity = '1';
            ui.bottomSheet.style.transform = 'translateY(0)';
        });

        // 애니메이션 완료 후 플래그 해제 (0.3s transition)
        setTimeout(function () {
            isAnimating = false;
        }, 350);

        isVisible = true;
        log('[Cheat] 열림');
    }

    // UI 숨김
    function hide() {
        if (!isVisible || isAnimating) return;

        // 탭 카운트 리셋 (닫을 때 터치가 카운트되는 것 방지)
        if (resetTapCount) resetTapCount();

        if (ui) {
            ui.overlay.style.opacity = '0';
            ui.bottomSheet.style.transform = 'translateY(100%)';

            // 애니메이션 후 DOM에서 제거
            setTimeout(function () {
                if (ui.overlay.parentNode) {
                    ui.overlay.parentNode.removeChild(ui.overlay);
                }
                if (ui.bottomSheet.parentNode) {
                    ui.bottomSheet.parentNode.removeChild(ui.bottomSheet);
                }
                // document 레벨 이벤트 리스너 정리 (메모리 누수 방지)
                if (docMouseMoveHandler) {
                    document.removeEventListener('mousemove', docMouseMoveHandler);
                }
                if (docMouseUpHandler) {
                    document.removeEventListener('mouseup', docMouseUpHandler);
                }
                listenersRegistered = false;
            }, 300);
        }
        isVisible = false;
        log('[Cheat] 닫힘');
    }

    // UI 토글
    function toggle() {
        if (isVisible) {
            hide();
        } else {
            show();
        }
    }

    // 데스크탑 Shift+Click 제스처
    function isInEditor() {
        return typeof CC_EDITOR !== 'undefined' && CC_EDITOR === true;
    }

    function setupDesktopGesture() {
        if (isInEditor()) return;  // 에디터에서는 제스쳐 비활성화
        document.addEventListener('mousedown', function (e) {
            if (e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                toggle();
            }
        }, true);
    }

    // 모바일 트리플 탭 제스처 (같은 위치에서만)
    var resetTapCount = null; // hide()에서 호출할 리셋 함수
    function setupMobileGesture() {
        if (isInEditor()) return;  // 에디터에서는 제스쳐 비활성화
        var tapCount = 0;
        var tapTimer = null;
        var firstTapX = 0;
        var firstTapY = 0;
        var TAP_TIMEOUT = 350; // 트리플 탭 제한시간 (ms)
        var TAP_RADIUS = 20; // 허용 반경 (px)

        // 외부에서 카운트 리셋 가능하도록
        resetTapCount = function () {
            tapCount = 0;
            if (tapTimer) {
                clearTimeout(tapTimer);
                tapTimer = null;
            }
            log('[Cheat] 탭 카운트 리셋');
        };

        window.addEventListener('touchend', function (e) {
            // 한 손가락 탭만 처리
            if (e.changedTouches.length !== 1) return;

            var touch = e.changedTouches[0];
            var x = touch.clientX;
            var y = touch.clientY;

            if (tapCount === 0) {
                // 첫 탭 - 위치 저장
                firstTapX = x;
                firstTapY = y;
                tapCount = 1;
                log('[Cheat] 탭 1 위치:', x, y);

                tapTimer = setTimeout(function () {
                    tapCount = 0;
                }, TAP_TIMEOUT);
            } else {
                // 이전 탭 위치와 거리 계산
                var dx = x - firstTapX;
                var dy = y - firstTapY;
                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= TAP_RADIUS) {
                    tapCount++;
                    log('[Cheat] 탭', tapCount, '거리:', Math.round(distance) + 'px');

                    if (tapCount === 3) {
                        // 트리플 탭 성공
                        clearTimeout(tapTimer);
                        tapCount = 0;
                        log('[Cheat] 트리플 탭 성공!');
                        toggle();
                    }
                } else {
                    // 위치가 다르면 새로운 첫 탭으로
                    log('[Cheat] 위치 벗어남, 리셋. 거리:', Math.round(distance) + 'px');
                    clearTimeout(tapTimer);
                    firstTapX = x;
                    firstTapY = y;
                    tapCount = 1;
                    tapTimer = setTimeout(function () {
                        tapCount = 0;
                    }, TAP_TIMEOUT);
                }
            }
        }, { capture: true, passive: true });
    }

    // 단일 명령어 추가 (오버로딩: action은 함수 또는 [함수, 설명])
    function add(name, action, groupKey) {
        if (!name || !action) return;

        var callback, desc;
        if (typeof action === 'function') {
            callback = action;
            desc = null;
        } else if (Array.isArray(action)) {
            callback = action[0];
            desc = action[1] || null;
        } else {
            console.error('[Cheat] 잘못된 액션:', name);
            return;
        }

        var group = groupKey || GLOBAL_GROUP;

        // 기존에 같은 이름이 있으면 먼저 제거
        if (actions[name]) {
            remove(name);
        }

        // 버튼 생성
        var btn = addActionButton(name, callback, desc, group);

        // actions에 저장
        actions[name] = {
            callback: callback,
            desc: desc,
            btn: btn,
            group: group,
            persistentStyles: null
        };

        // groups commands에 추가
        if (groups[group]) {
            groups[group].commands.push(name);
        }

        log('[Cheat] 추가됨: "' + name + '"');
    }

    // 단일 명령어 삭제
    function remove(name) {
        if (!actions[name]) {
            console.warn('[Cheat] 명령어 없음:', name);
            return;
        }

        var actionData = actions[name];

        // 버튼 제거
        removeActionButton(actionData.btn);

        // groups에서 제거
        var group = actionData.group;
        if (groups[group]) {
            var idx = groups[group].commands.indexOf(name);
            if (idx > -1) {
                groups[group].commands.splice(idx, 1);
            }
            // 그룹이 비었고 global이 아니면 탭과 컨텐츠 삭제
            if (groups[group].commands.length === 0 && group !== GLOBAL_GROUP) {
                if (groups[group].tab && groups[group].tab.parentNode) {
                    groups[group].tab.parentNode.removeChild(groups[group].tab);
                }
                if (groups[group].content && groups[group].content.parentNode) {
                    groups[group].content.parentNode.removeChild(groups[group].content);
                }
                if (groups[group].dropdownItem && groups[group].dropdownItem.parentNode) {
                    groups[group].dropdownItem.parentNode.removeChild(groups[group].dropdownItem);
                }
                delete groups[group];
            }
        }

        // actions에서 제거
        delete actions[name];

        log('[Cheat] 삭제됨: "' + name + '"');
    }

    // 그룹 추가 (오버로딩: groupInfo는 문자열 또는 [이름, 설명])
    function addGroup(groupInfo, actionMap) {
        if (!groupInfo || !actionMap) return;

        var groupKey, groupDesc;
        if (typeof groupInfo === 'string') {
            groupKey = groupInfo;
            groupDesc = null;
        } else if (Array.isArray(groupInfo)) {
            groupKey = groupInfo[0];
            groupDesc = groupInfo[1] || null;
        } else {
            console.error('[Cheat] 잘못된 그룹 정보');
            return;
        }

        // 그룹 초기화 (desc 설정)
        if (!groups[groupKey]) {
            groups[groupKey] = {
                desc: groupDesc,
                commands: [],
                tab: null,
                content: null,
                dropdownItem: null
            };
        } else {
            groups[groupKey].desc = groupDesc;
        }

        var count = 0;
        for (var name in actionMap) {
            if (actionMap.hasOwnProperty(name)) {
                add(name, actionMap[name], groupKey);
                count++;
            }
        }

        log('[Cheat] 그룹 추가됨: "' + groupKey + '" (' + count + '개 명령어)');
    }

    // 그룹 삭제
    function removeGroup(groupKey) {
        if (!groups[groupKey]) {
            console.warn('[Cheat] 그룹 없음:', groupKey);
            return;
        }

        // 탭, 컨텐츠, 드롭다운 아이템 참조를 미리 저장 (remove()가 그룹을 삭제할 수 있으므로)
        var tab = groups[groupKey].tab;
        var content = groups[groupKey].content;
        var dropdownItem = groups[groupKey].dropdownItem;

        // 그룹의 모든 명령어 삭제 (복사본 사용)
        var commands = groups[groupKey].commands.slice();
        for (var i = 0; i < commands.length; i++) {
            remove(commands[i]);
        }

        // 탭, 컨텐츠, 드롭다운 아이템 삭제 (remove()에서 이미 삭제했을 수 있으므로 체크)
        if (tab && tab.parentNode) {
            tab.parentNode.removeChild(tab);
        }
        if (content && content.parentNode) {
            content.parentNode.removeChild(content);
        }
        if (dropdownItem && dropdownItem.parentNode) {
            dropdownItem.parentNode.removeChild(dropdownItem);
        }

        // 그룹 자체 삭제 (아직 남아있다면)
        delete groups[groupKey];

        // 삭제된 그룹이 activeTab이면 다른 탭으로 전환
        if (ui && ui.activeTab === groupKey) {
            var firstGroup = Object.keys(groups)[0];
            if (firstGroup) {
                selectTab(firstGroup);
            } else {
                ui.activeTab = null;
                updateDropdownTrigger();
            }
        }

        log('[Cheat] 그룹 삭제됨: "' + groupKey + '"');
    }

    // 전체 삭제
    function clear() {
        // 모든 명령어의 버튼 제거
        for (var name in actions) {
            if (actions.hasOwnProperty(name)) {
                removeActionButton(actions[name].btn);
            }
        }

        // 모든 탭, 컨텐츠, 드롭다운 아이템 제거
        for (var groupKey in groups) {
            if (groups.hasOwnProperty(groupKey)) {
                if (groups[groupKey].tab && groups[groupKey].tab.parentNode) {
                    groups[groupKey].tab.parentNode.removeChild(groups[groupKey].tab);
                }
                if (groups[groupKey].content && groups[groupKey].content.parentNode) {
                    groups[groupKey].content.parentNode.removeChild(groups[groupKey].content);
                }
                if (groups[groupKey].dropdownItem && groups[groupKey].dropdownItem.parentNode) {
                    groups[groupKey].dropdownItem.parentNode.removeChild(groups[groupKey].dropdownItem);
                }
            }
        }

        // activeTab 초기화
        if (ui) {
            ui.activeTab = null;
            updateDropdownTrigger();
        }

        // 초기화
        actions = {};
        groups = {};

        log('[Cheat] 모든 명령어 삭제됨');
    }

    // 명령어 트리 출력
    function list() {
        log('[Cheat] 명령어 목록:');

        for (var groupKey in groups) {
            if (groups.hasOwnProperty(groupKey)) {
                var group = groups[groupKey];
                if (group.commands.length === 0) continue;

                var groupLabel = '  [' + groupKey + ']';
                if (group.desc) {
                    groupLabel += ' ' + group.desc;
                }
                console.log(groupLabel);

                for (var i = 0; i < group.commands.length; i++) {
                    var cmdName = group.commands[i];
                    var actionData = actions[cmdName];
                    var cmdLabel = '    - ' + cmdName;
                    if (actionData && actionData.desc) {
                        cmdLabel += ': ' + actionData.desc;
                    }
                    console.log(cmdLabel);
                }
            }
        }
    }

    // 메인 함수
    function cheat(actionMap, containerEl) {
        container = containerEl || document.body;

        createUI();

        // actionMap이 있을 경우에만 global 그룹에 등록
        if (actionMap) {
            for (var name in actionMap) {
                if (actionMap.hasOwnProperty(name)) {
                    add(name, actionMap[name], GLOBAL_GROUP);
                }
            }
        }
    }

    // 상태라인 설정
    function statusline(callback) {
        statuslineCallback = callback;
        updateStatuslineUI();
    }

    // 상태라인 UI 갱신
    function updateStatuslineUI() {
        var el = document.getElementById('cheat-statusline');
        if (!el) return;

        if (!statuslineCallback) {
            el.style.display = 'none';
            return;
        }

        // opt 객체 생성 (향후 확장용)
        var opt = {
            separator: ' | '
        };

        var result = statuslineCallback(opt);
        var items = Array.isArray(result) ? result : [];
        var text = items.filter(function(v) { return v != null; }).join(opt.separator);

        el.textContent = text;
        el.style.display = text ? '' : 'none';
    }

    statusline.refresh = updateStatuslineUI;

    // 전역 등록
    window.cheat = cheat;
    window.cheat.show = show;
    window.cheat.hide = hide;
    window.cheat.toggle = toggle;
    window.cheat.statusline = statusline;

    // actions/groups는 읽기 전용 스냅샷 반환 (얕은 복사 - 최상위 키만 보호)
    Object.defineProperty(window.cheat, 'actions', {
        get: function() { return Object.assign({}, actions); },
        enumerable: true
    });
    Object.defineProperty(window.cheat, 'groups', {
        get: function() { return Object.assign({}, groups); },
        enumerable: true
    });

    // 동적 추가/삭제 API
    window.cheat.add = add;
    window.cheat.remove = remove;
    window.cheat.addGroup = addGroup;
    window.cheat.removeGroup = removeGroup;
    window.cheat.clear = clear;
    window.cheat.list = list;

    // 디버그 모드 제어
    Object.defineProperty(window.cheat, 'debug', {
        get: function() { return debugMode; },
        set: function(v) { debugMode = !!v; },
        enumerable: true
    });

    // 제스처 등록
    setupDesktopGesture();
    setupMobileGesture();

    // postMessage를 통한 명령어 추가 (콜백 대신 이벤트 발행)
    function addViaMessage(payload, groupKey) {
        var key = payload.key;
        var name = payload.name;
        var targetGroup = groupKey || GLOBAL_GROUP;

        // 버튼 클릭 시 이벤트 발행하는 콜백 생성
        var callback = function() {
            window.postMessage({
                type: 'CHEAT_EVENT',
                event: 'action_triggered',
                payload: {
                    key: key,
                    name: name,
                    group: targetGroup
                }
            }, window.location.origin);
        };

        add(name, payload.desc ? [callback, payload.desc] : callback, targetGroup);
    }

    // postMessage를 통한 그룹 추가
    function addGroupViaMessage(payload) {
        var groupInfo = payload.group;  // string | [name, desc]
        var actionList = payload.actions || [];

        // 그룹 키 추출
        var groupKey = Array.isArray(groupInfo) ? groupInfo[0] : groupInfo;

        // 기존 addGroup 로직으로 그룹 생성 (빈 actionMap)
        addGroup(groupInfo, {});

        // 각 액션을 addViaMessage로 등록
        actionList.forEach(function(act) {
            addViaMessage(act, groupKey);
        });
    }

    // postMessage 핸들러
    function handlePostMessage(e) {
        // 보안: 같은 origin의 메시지만 허용
        if (e.origin !== window.location.origin) return;
        if (!e.data || e.data.type !== 'CHEAT_REQUEST') return;

        var data = e.data;
        var action = data.action;
        var payload = data.payload || {};

        switch (action) {
            case 'init':
                cheat(null, container || document.body);
                // 글로벌 명령어 등록
                if (payload.actions && Array.isArray(payload.actions)) {
                    payload.actions.forEach(function(act) {
                        addViaMessage(act, GLOBAL_GROUP);
                    });
                }
                break;
            case 'addGroup':
                addGroupViaMessage(payload);
                break;
            case 'clear':
                clear();
                break;
            case 'removeGroup':
                removeGroup(payload.group);
                break;
            // show/hide/toggle은 내부 제스처 전용 (보안상 외부 노출 안함)
        }
    }

    // postMessage 리스너 자동 등록
    window.addEventListener('message', handlePostMessage);

    log('[Cheat] 초기화 완료. 제스처: 데스크탑=Shift+클릭, 모바일=트리플탭');
})();
