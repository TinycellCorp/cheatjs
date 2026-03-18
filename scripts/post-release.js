#!/usr/bin/env node
/**
 * 릴리즈 후 리마인더 출력
 * 버전 동기화는 version hook(sync-version.js)에서 처리됨.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiRef = path.join(root, 'skills', 'cheatjs', 'docs', 'api-reference.md');

console.log('');
console.log('\x1b[33m[REMINDER]\x1b[0m API 변경이 있었다면 아래 파일도 업데이트하세요:');
console.log('  ' + apiRef);
console.log('  방법: 수동 편집 또는 /cheatjs api');
console.log('');
