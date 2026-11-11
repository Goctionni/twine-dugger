# Test environments (jsdom)

This repo runs every test in `jsdom` (`vitest.config.ts`: `test.environment`). Browser mode (real browser) is not used; what jsdom cannot show (layout, focus, what is on top) is checked by hand in a real browser.

## Options

```ts
defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000', html: '<!DOCTYPE html><html><body></body></html>' },
    },
  },
});
```

## A different environment for one file

A magic comment at the top of the file, for example a pure-logic test that should run in Node:

```ts
// @vitest-environment node
```

`happy-dom` is faster but has fewer APIs and is not installed here.

## CSS and assets

In jsdom CSS is not processed by default. `test.css: true` processes it; `test.css: { include: /\.module\.css$/ }` only some files.

If an external dependency fails on CSS or asset imports, inline it: `test.server.deps.inline: ['package']`.

## v5

Assignments to DOM-environment globals (for example `window.innerWidth`) now reach the underlying jsdom implementation.
