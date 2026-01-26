#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const cheatPath = path.join(root, 'cheat.js');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

let content = fs.readFileSync(cheatPath, 'utf8');

// 기존 버전 주석 패턴: /** @version X.X.X */
const versionPattern = /^\/\*\* @version [\d.]+ \*\/\n?/;
const versionComment = `/** @version ${version} */\n`;

if (versionPattern.test(content)) {
  // 기존 버전 주석 업데이트
  content = content.replace(versionPattern, versionComment);
} else {
  // 새 버전 주석 추가
  content = versionComment + content;
}

fs.writeFileSync(cheatPath, content, 'utf8');
console.log(`Injected version ${version} into cheat.js`);
