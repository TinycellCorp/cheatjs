#!/usr/bin/env node
/**
 * version hook용 버전 동기화 스크립트
 * npm version 실행 시 plugin.json과 api-reference.md의 버전을 package.json과 맞춘다.
 * 릴리즈 커밋에 버전 일치가 포함되도록 pre-release 시점에 실행.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

const targets = {
    apiRef: path.join(root, 'skills', 'cheatjs', 'docs', 'api-reference.md'),
    pluginJson: path.join(root, '.claude-plugin', 'plugin.json')
};

var synced = 0;

// 1. api-reference.md 버전 헤더
if (fs.existsSync(targets.apiRef)) {
    var content = fs.readFileSync(targets.apiRef, 'utf8');
    var pattern = /^# cheatjs API Reference \(v[\d.]+\)/;
    var newHeader = '# cheatjs API Reference (v' + version + ')';
    if (pattern.test(content)) {
        content = content.replace(pattern, newHeader);
        fs.writeFileSync(targets.apiRef, content, 'utf8');
        console.log('[sync-version] api-reference.md -> v' + version);
        synced++;
    }
}

// 2. plugin.json 버전
if (fs.existsSync(targets.pluginJson)) {
    var content = fs.readFileSync(targets.pluginJson, 'utf8');
    var updated = content.replace(/"version"\s*:\s*"[\d.]+"/, '"version": "' + version + '"');
    fs.writeFileSync(targets.pluginJson, updated, 'utf8');
    console.log('[sync-version] plugin.json -> v' + version);
    synced++;
}

if (synced === 0) {
    console.log('[sync-version] 동기화 대상 없음');
}
