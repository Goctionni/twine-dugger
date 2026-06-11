# Twine Dugger

Twine Dugger is a browser-extension that's intended to help either debug or cheat in Twine games. The supported story formats are

- SugarCube 2
- Harlowe 3 _(Only games using Chapel's custom-macro framework)_
- Chapbook 2
- Snowman 2

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

## Status

This project is extremely "work in progress", there's probably a ton of dead code, stuff that
needs to be refactored, tests that don't really test things, usecases missed.
