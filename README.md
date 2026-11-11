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
- Tailwind CSS - Styling

## Commands

You will need vite-plus installed on your machine.

See: https://viteplus.dev/guide/

`vp i` - install dependencies
`vp check` - lint & format
`vp check --fix` - lint & format, autofix
`vp build` - build extension
`vp build --watch` - build extension and watch for file changes

If vite-plus (`vp`) is not installed globally, install dependencies using `pnpm i` and use `npx vp ...` instead of `vp ...`.

## Documentation

Technical documentation is placed in the docs directory as markdown files. See [docs/README.md](docs/README.md).

## Agent skills and Claude Code

Skills for coding agents live in `.agents/skills`. Claude Code does not read this (industry standard) skills-directory ([anthropics/claude-code#31005](https://github.com/anthropics/claude-code/issues/31005)). If you use Claude Code, link `.claude/skills` to `.agents/skills` but keep the link out of git. The easiest way is to ask Claude Code to create the link:

```
Link .claude/skills to .agents/skills (a symlink, or a directory junction on Windows), add .claude/ to .git/info/exclude, and don't stage or commit anything.
```
