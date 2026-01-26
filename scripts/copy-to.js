const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dest = args.find(a => !a.startsWith('--'));
const flags = args.filter(a => a.startsWith('--'));

if (!dest) {
    console.error('Usage: npm run copy-to <target-dir> [--all|--min|--dts]');
    console.error('  --all  Copy all files (cheat.js, cheat.min.js, cheat.d.ts)');
    console.error('  --min  Also copy cheat.min.js');
    console.error('  --dts  Also copy cheat.d.ts');
    process.exit(1);
}

// 기본: cheat.js만
const files = ['cheat.js'];

if (flags.includes('--all')) {
    files.push('cheat.min.js', 'cheat.d.ts');
} else {
    if (flags.includes('--min')) files.push('cheat.min.js');
    if (flags.includes('--dts')) files.push('cheat.d.ts');
}

files.forEach(file => {
    const src = path.join(__dirname, '..', file);
    const target = path.join(dest, file);
    fs.copyFileSync(src, target);
    console.log(`Copied: ${target}`);
});
