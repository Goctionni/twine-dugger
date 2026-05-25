# Testing Strategy and Roadmap

This document defines how we grow test coverage in twine-dugger with high return on effort, fast developer feedback, and confidence in core behaviors.

## General Testing Strategy and Approach

### Test Layers

- Unit tests (Vitest): primary safety net for shared logic and state transforms.
- Component tests (Vitest + Solid testing library): verify UI behavior contracts and interactions.
- E2E tests (Playwright): tests for critical flows, with a small set of full journey tests.

### Principles (aligned with Vitest best practices)

- Prefer state/outcome assertions over implementation-detail assertions.
- Keep tests deterministic and isolated.
- Use DAMP test style (clear intent, low indirection).
- Mock only external boundaries (Chrome APIs, page execution, localStorage edge cases) when needed.
- Keep test files close to sources for unit/component tests.
- Treat coverage as signal, not goal. Branches should be tested when behavior is non-trivial.

### Mocked Game Runtime (Canonical)

Twine Dugger talks to game state through the injected `window.TwineDugger` API plus `window.SugarCube`/`window.Harlowe` metadata.
For deterministic tests, we mock this runtime boundary directly instead of depending on a real game build.

Canonical shared fixture:

- `src/shared/testing/mock-twine-game.ts`

What it provides:

- `baselineMockTwineGameSeed`: JSON-serializable game seed data (metadata, state, passages).
- `createMockTwineGameSeed()`: easy base+patch builder for per-test customization.
- `createLargeTopLevelSeed()`: quick generation for large top-level state/performance scenarios.
- `createSugarCubeWindowMock()`: reusable `window.SugarCube` mock for unit/component tests.

Why this shape:

- JSON-serializable seed works in both Playwright `page.addInitScript` and Vitest/jsdom.
- Runtime behavior (set/delete/duplicate/locks) stays close to production API contract.
- Runtime emits diff updates after state edits, so UI reacts like real game polling loop.
- Tests can vary data by cloning seed, without copy-pasting ad-hoc mocks.

### Developer Workflow

Primary commands:

- Unit tests once: `vp test`
- Unit tests watch: `vp test --watch`
- Coverage: `vp test --coverage`
- E2E smoke: `vp run test:e2e:smoke`
- Full E2E: `vp run test:e2e`

Mock-runtime examples:

- Playwright example: `tests/e2e/mocked-game-runtime.test.ts`
- Playwright installer: `tests/e2e/helpers/install-mock-game-runtime.ts`
- Vitest example using same fixture: `src/devtools-panel/api/remote-functions/getMetaData.test.ts`

Recommended flow for new feature tests:

1. Start with `baselineMockTwineGameSeed`.
2. Clone and tweak only fields needed for scenario.
3. Install runtime mock (Playwright init script or jsdom globals).
4. Assert user-visible outcomes in UI/store, not internal function-call sequence.
5. Add one unhappy-path variant (missing fields, unsupported format, null updates) when behavior has branches.

When to use network route mocks (`page.route`) vs runtime mocks:

- Use runtime mocks for extension/game bridge behavior (`chrome.scripting`, `window.TwineDugger`, story metadata).
- Use route mocks for true HTTP boundaries.
- If both boundaries exist in one flow, mock both explicitly.

### Branch Testing Policy

- Any non-trivial conditional branch should get at least one explicit test.
- Trivial branches may be deferred if behavior is obvious and low-risk.
- If deferred, log the gap in PR notes with reason.

### Definition of Done for New Features/Fixes

- New behavior: test exists and fails without change.
- Bug fix: regression test exists reproducing old bug path.
- At least one unhappy-path test when input can be invalid or external call can fail.
- No skipped tests unless explicitly justified.
