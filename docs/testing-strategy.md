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

### Developer Workflow

Primary commands:

- Unit tests once: `vp test`
- Unit tests watch: `vp test --watch`
- Coverage: `vp test --coverage`
- E2E smoke: `vp run test:e2e:smoke`
- Full E2E: `vp run test:e2e`

### Branch Testing Policy

- Any non-trivial conditional branch should get at least one explicit test.
- Trivial branches may be deferred if behavior is obvious and low-risk.
- If deferred, log the gap in PR notes with reason.

### Definition of Done for New Features/Fixes

- New behavior: test exists and fails without change.
- Bug fix: regression test exists reproducing old bug path.
- At least one unhappy-path test when input can be invalid or external call can fail.
- No skipped tests unless explicitly justified.
