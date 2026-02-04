# cheatjs

Game engine agnostic cheat UI (bottom sheet) library.

## Tech Stack
- Pure JavaScript (ES5 compatible, single IIFE in `cheat.js`)
- TypeScript declarations in `cheat.d.ts`
- terser for minification

## Build & Commands
- `npm run build` - inject version + minify + validate types + type check
- `npm run minify` - terser cheat.js → cheat.min.js
- `npm run type-check` - tsc --noEmit cheat.d.ts
- `npm run validate-types` - checks type declarations match implementation

## Structure
- `cheat.js` - main source (single file IIFE)
- `cheat.min.js` - minified output
- `cheat.d.ts` - TypeScript type declarations
- `scripts/` - build helper scripts

## Code Style
- ES5 compatible (var, no arrow functions, no class syntax)
- Korean comments
- IIFE pattern with `window.cheat` export
- All internal state as closure variables
