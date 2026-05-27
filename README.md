# Twine Dugger

Twine Dugger is a chrome extension that's intended to help either debug Twine games (using either
SugarCube or Harlowe), or to cheat in those games.

## Dependencies / Technologies

- vite-plus - cli tool
- pnpm - Package manager
- typescript - Types
- vite - build tool
- SolidJS - UI
- Tailwindcs - Styling

## Commands

You will need vite-plus installed on your machine.

See: https://viteplus.dev/guide/

`vp i` - install dependencies
`vp check` - lint & format
`vp check --fix` - lint & format, autofix
`vp build` - build extension
`vp build --watch` - build extension and watch for file changes
`pnpm exec playwright install chromium` - install Playwright browser (one-time)
`pnpm run test:e2e:smoke` - run Playwright smoke test for devtools panel

## Status

This project is extremely "work in progress", there's probably a ton of dead code, stuff that
needs to be refactored, tests that don't really test things, usecases missed.
