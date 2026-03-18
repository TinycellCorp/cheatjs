#!/usr/bin/env node
/**
 * 배포 전 검증 + 버전 자동 결정 스크립트
 * 사용: node scripts/validate-release.js [--json]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const jsonMode = process.argv.includes('--json');

function run(cmd) {
    try {
        return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (e) {
        return null;
    }
}

var checks = [];
var errors = [];

function check(name, fn) {
    try {
        var result = fn();
        if (result === true) {
            checks.push({ name: name, status: 'ok' });
        } else {
            checks.push({ name: name, status: 'fail', reason: result });
            errors.push(name + ': ' + result);
        }
    } catch (e) {
        checks.push({ name: name, status: 'fail', reason: e.message });
        errors.push(name + ': ' + e.message);
    }
}

// 1. git working directory clean
check('git-clean', function () {
    var status = run('git status --porcelain');
    if (status === null) return 'git 명령 실행 실패';
    if (status.length > 0) return '커밋되지 않은 변경 사항 있음';
    return true;
});

// 2. 현재 브랜치 = main
check('branch-main', function () {
    var branch = run('git rev-parse --abbrev-ref HEAD');
    if (branch !== 'main') return '현재 브랜치: ' + branch + ' (main이어야 함)';
    return true;
});

// 3. npm run build 통과
check('build', function () {
    var result = run('npm run build');
    if (result === null) return 'npm run build 실패';
    return true;
});

// 4. skills/cheatjs/SKILL.md 존재 + frontmatter 유효성
check('skill-md', function () {
    var skillPath = path.join(root, 'skills', 'cheatjs', 'SKILL.md');
    if (!fs.existsSync(skillPath)) return '파일 없음: skills/cheatjs/SKILL.md';
    var content = fs.readFileSync(skillPath, 'utf8');
    var match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return 'SKILL.md frontmatter 없음';
    var fm = match[1];
    if (fm.indexOf('description') === -1) return 'frontmatter에 description 없음';
    if (fm.indexOf('allowed-tools') === -1) return 'frontmatter에 allowed-tools 없음';
    if (fm.indexOf('user-invocable') === -1) return 'frontmatter에 user-invocable 없음';
    return true;
});

// 5. api-reference.md 존재
check('api-reference', function () {
    var refPath = path.join(root, 'skills', 'cheatjs', 'docs', 'api-reference.md');
    if (!fs.existsSync(refPath)) return '파일 없음: skills/cheatjs/docs/api-reference.md';
    return true;
});

// 6. plugin.json 존재 + 필수 필드
check('plugin-json', function () {
    var pPath = path.join(root, '.claude-plugin', 'plugin.json');
    if (!fs.existsSync(pPath)) return '파일 없음: .claude-plugin/plugin.json';
    var json = JSON.parse(fs.readFileSync(pPath, 'utf8'));
    if (!json.name) return 'plugin.json에 name 없음';
    if (!json.version) return 'plugin.json에 version 없음';
    if (!json.description) return 'plugin.json에 description 없음';
    return true;
});

// 7. cheat.d.ts 존재
check('types', function () {
    if (!fs.existsSync(path.join(root, 'cheat.d.ts'))) return '파일 없음: cheat.d.ts';
    return true;
});

// 8. npm 인증 상태
check('npm-auth', function () {
    var whoami = run('npm whoami --registry=https://npm.pkg.github.com');
    if (!whoami) return 'npm 인증 실패 — npm login 또는 .npmrc 확인';
    return true;
});

// 버전 자동 결정
function determineVersion() {
    var lastTag = run('git describe --tags --abbrev=0');
    var range = lastTag ? lastTag + '..HEAD' : 'HEAD';
    var log = run('git log --oneline ' + range);

    if (!log || log.length === 0) {
        return { version: null, reason: '마지막 태그 이후 변경 사항 없음', commits: [] };
    }

    var lines = log.split('\n').filter(function (l) { return l.trim().length > 0; });
    var commits = [];
    var level = 0; // 0=none, 1=patch, 2=minor, 3=major

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var msg = line.replace(/^[a-f0-9]+ /, '');
        commits.push(msg);

        if (/^release:/.test(msg)) continue; // skip

        if (/BREAKING CHANGE|^[a-z]+!:/.test(msg)) {
            level = Math.max(level, 3);
        } else if (/^feat[\(:]/.test(msg)) {
            level = Math.max(level, 2);
        } else {
            level = Math.max(level, 1); // patch 기본값
        }
    }

    if (level === 0) {
        return { version: null, reason: '릴리즈 커밋만 있음', commits: commits };
    }

    var names = ['', 'patch', 'minor', 'major'];
    return { version: names[level], reason: null, commits: commits };
}

var versionInfo = determineVersion();

// 출력
if (jsonMode) {
    console.log(JSON.stringify({
        version: versionInfo.version,
        versionReason: versionInfo.reason,
        commits: versionInfo.commits,
        checks: checks,
        errors: errors,
        passed: errors.length === 0
    }, null, 2));
} else {
    console.log('');
    console.log('\x1b[36m[validate-release]\x1b[0m 배포 전 검증');
    console.log('');
    for (var i = 0; i < checks.length; i++) {
        var c = checks[i];
        if (c.status === 'ok') {
            console.log('  \x1b[32m✓\x1b[0m ' + c.name);
        } else {
            console.log('  \x1b[31m✗\x1b[0m ' + c.name + ' — ' + c.reason);
        }
    }
    console.log('');
    if (errors.length > 0) {
        console.log('\x1b[31m[FAIL]\x1b[0m ' + errors.length + '개 검증 실패');
    } else {
        console.log('\x1b[32m[PASS]\x1b[0m 모든 검증 통과');
    }
    if (versionInfo.version) {
        console.log('\x1b[36m[VERSION]\x1b[0m 자동 결정: ' + versionInfo.version + ' (' + versionInfo.commits.length + '개 커밋)');
    } else {
        console.log('\x1b[33m[VERSION]\x1b[0m ' + (versionInfo.reason || '버전 결정 불가'));
    }
    console.log('');
}

process.exit(errors.length > 0 ? 1 : 0);
