#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

// 동기화 대상 경로
const targets = {
    apiRef: path.join(root, 'plugin', 'skills', 'api', 'docs', 'api-reference.md'),
    marketplace: path.join(root, '.claude-plugin', 'marketplace.json'),
    pluginJson: path.join(root, 'plugin', '.claude-plugin', 'plugin.json')
};

console.log('');
console.log('\x1b[36m[post-release]\x1b[0m 플러그인 버전 동기화...');

// 1. api-reference.md 버전 헤더 업데이트
if (fs.existsSync(targets.apiRef)) {
    var content = fs.readFileSync(targets.apiRef, 'utf8');
    var versionPattern = /^# cheatjs API Reference \(v[\d.]+\)/;
    var newHeader = '# cheatjs API Reference (v' + version + ')';

    if (versionPattern.test(content)) {
        content = content.replace(versionPattern, newHeader);
        fs.writeFileSync(targets.apiRef, content, 'utf8');
        console.log('\x1b[32m[OK]\x1b[0m api-reference.md 버전 업데이트: v' + version);
    } else {
        console.log('\x1b[33m[WARN]\x1b[0m api-reference.md 버전 헤더를 찾을 수 없습니다.');
    }
} else {
    console.log('\x1b[33m[SKIP]\x1b[0m api-reference.md 없음: ' + targets.apiRef);
}

// 2. marketplace.json 버전 업데이트
if (fs.existsSync(targets.marketplace)) {
    var content = fs.readFileSync(targets.marketplace, 'utf8');
    var updated = content.replace(/"version"\s*:\s*"[\d.]+"/,  '"version": "' + version + '"');
    fs.writeFileSync(targets.marketplace, updated, 'utf8');
    console.log('\x1b[32m[OK]\x1b[0m marketplace.json 버전 업데이트: v' + version);
} else {
    console.log('\x1b[33m[SKIP]\x1b[0m marketplace.json 없음: ' + targets.marketplace);
}

// 3. plugin.json 버전 업데이트
if (fs.existsSync(targets.pluginJson)) {
    var content = fs.readFileSync(targets.pluginJson, 'utf8');
    var updated = content.replace(/"version"\s*:\s*"[\d.]+"/,  '"version": "' + version + '"');
    fs.writeFileSync(targets.pluginJson, updated, 'utf8');
    console.log('\x1b[32m[OK]\x1b[0m plugin.json 버전 업데이트: v' + version);
} else {
    console.log('\x1b[33m[SKIP]\x1b[0m plugin.json 없음: ' + targets.pluginJson);
}

console.log('');
console.log('\x1b[33m[REMINDER]\x1b[0m API 변경이 있었다면 아래 파일도 업데이트하세요:');
console.log('  ' + targets.apiRef);
console.log('  방법: 수동 편집');
console.log('');
