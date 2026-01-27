#!/usr/bin/env node
/**
 * cheat.js의 window.cheat.* 할당과 cheat.d.ts의 CheatFunction 인터페이스를
 * 비교하여 타입 정의 누락을 검출하는 스크립트
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cheatJsPath = path.join(root, 'cheat.js');
const cheatDtsPath = path.join(root, 'cheat.d.ts');

// cheat.js에서 window.cheat.* 할당 추출
function extractJsProperties(content) {
  const properties = new Set();

  // window.cheat.xxx = ... 패턴
  const directAssignRegex = /window\.cheat\.(\w+)\s*=/g;
  let match;
  while ((match = directAssignRegex.exec(content)) !== null) {
    properties.add(match[1]);
  }

  // Object.defineProperty(window.cheat, 'xxx', ...) 패턴
  const definePropertyRegex = /Object\.defineProperty\(window\.cheat,\s*['"](\w+)['"]/g;
  while ((match = definePropertyRegex.exec(content)) !== null) {
    properties.add(match[1]);
  }

  return properties;
}

// cheat.d.ts에서 CheatFunction 인터페이스의 속성 추출
function extractDtsProperties(content) {
  const properties = new Set();

  // CheatFunction 인터페이스 블록 추출
  const interfaceMatch = content.match(/interface CheatFunction\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
  if (!interfaceMatch) {
    throw new Error('CheatFunction interface not found in cheat.d.ts');
  }

  const interfaceBody = interfaceMatch[1];

  // 줄 단위로 파싱하여 최상위 멤버만 추출
  // 호출 시그니처 (로 시작), 주석 제외
  const lines = interfaceBody.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // 빈 줄, 주석, 호출 시그니처 (로 시작) 제외
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('(')) {
      continue;
    }
    // readonly? name: 또는 name( 패턴 매칭
    const memberMatch = trimmed.match(/^(?:readonly\s+)?(\w+)(?:\s*\(|:)/);
    if (memberMatch) {
      properties.add(memberMatch[1]);
    }
  }

  return properties;
}

// 메인 실행
try {
  const jsContent = fs.readFileSync(cheatJsPath, 'utf8');
  const dtsContent = fs.readFileSync(cheatDtsPath, 'utf8');

  const jsProps = extractJsProperties(jsContent);
  const dtsProps = extractDtsProperties(dtsContent);

  // cheat.js에는 있지만 cheat.d.ts에는 없는 속성
  const missingInDts = [...jsProps].filter(p => !dtsProps.has(p));

  // cheat.d.ts에는 있지만 cheat.js에는 없는 속성
  const missingInJs = [...dtsProps].filter(p => !jsProps.has(p));

  let hasError = false;

  if (missingInDts.length > 0) {
    console.error('\x1b[31m[ERROR]\x1b[0m cheat.d.ts에 누락된 타입:');
    missingInDts.forEach(p => console.error(`  - ${p}`));
    hasError = true;
  }

  if (missingInJs.length > 0) {
    console.error('\x1b[33m[WARN]\x1b[0m cheat.js에 없는 타입 정의:');
    missingInJs.forEach(p => console.error(`  - ${p}`));
    // 경고만 표시, 에러로 처리하지 않음
  }

  if (hasError) {
    console.error('\ncheat.d.ts의 CheatFunction 인터페이스를 업데이트하세요.');
    process.exit(1);
  }

  console.log(`\x1b[32m[OK]\x1b[0m 타입 동기화 검증 완료 (${jsProps.size}개 속성)`);

} catch (error) {
  console.error('\x1b[31m[ERROR]\x1b[0m', error.message);
  process.exit(1);
}
