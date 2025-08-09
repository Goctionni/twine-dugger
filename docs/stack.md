# Stack & Tooling

## Runtime
- **Chrome DevTools extension** (Manifest v3)
- Targets **Twine** engines: **SugarCube** and **Harlowe**

## Frontend
- **SolidJS** (UI)
- **Tailwind CSS** (styling)

## Language & Build
- **TypeScript**
- **tsdown** (build bundler) with `vite-plugin-solid`, PostCSS, Tailwind
- Output bundles: `dist/devtools-panel.js`, `dist/content-script.js`, `dist/create-panel.js`

## Package manager
- **pnpm**

## Formatting & Types
- **Prettier** (`.prettierrc`, `.prettierignore`)
- TypeScript configs: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`

## Scripts
```json
{
  "build": "tsdown",
  "prettier": "prettier . -c",
  "prettier:fix": "prettier . -w",
  "type-check": "tsc --noEmit"
}
```
