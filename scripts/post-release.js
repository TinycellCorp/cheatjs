#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

// 스킬 api-reference.md 경로 (user-level)
const home = process.env.USERPROFILE || process.env.HOME;
const apiRefPath = path.join(home, '.claude', 'skills', 'cheatjs', 'docs', 'api-reference.md');

console.log('');
console.log('\x1b[36m[post-release]\x1b[0m 스킬 동기화 확인...');

if (fs.existsSync(apiRefPath)) {
    let content = fs.readFileSync(apiRefPath, 'utf8');
    const versionPattern = /^# cheatjs API Reference \(v[\d.]+\)/;
    const newHeader = `# cheatjs API Reference (v${version})`;

    if (versionPattern.test(content)) {
        content = content.replace(versionPattern, newHeader);
        fs.writeFileSync(apiRefPath, content, 'utf8');
        console.log(`\x1b[32m[OK]\x1b[0m api-reference.md 버전 업데이트: v${version}`);
    } else {
        console.log('\x1b[33m[WARN]\x1b[0m api-reference.md 버전 헤더를 찾을 수 없습니다.');
    }

    console.log('');
    console.log('\x1b[33m[REMINDER]\x1b[0m API 변경이 있었다면 아래 파일도 업데이트하세요:');
    console.log(`  ${apiRefPath}`);
    console.log('  방법: 수동 편집');
} else {
    console.log(`\x1b[33m[SKIP]\x1b[0m 스킬 파일 없음 (경로: ${apiRefPath})`);
}
console.log('');
