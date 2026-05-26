# Mutation Testing Strategy and Setup

This document defines canonical mutation-testing setup for twine-dugger, including performance model, known framework constraints, and rollout plan.

## Objectives

- Run mutation testing reliably in current Vite+ stack.
- Reach practical runtime for day-to-day use.
- Keep JSDOM-capable tests working for UI-heavy modules.
- Scale from smoke checks to targeted CI and then broader coverage.

## Canonical Commands

Current command set:

- Smoke dry run: `vp run test:mutation:smoke`
- Smoke mutation run: `vp run test:mutation:smoke:run`
- Full mutation scaffold: `vp run test:mutation`

## Current Baseline (Measured)

Smoke scope:

- Mutated file: `src/shared/type-helpers.ts`
- Tests executed per mutant (average): 1.00
- Mutants: 104
- Killed: 104
- Score: 100%

Runtime baseline (command runner path):

- Total: 108s
- Initial dry run: ~6.3s
- Mutation phase: ~101.7s
- Effective cost: ~0.98s per mutant after dry run

Observed scaling implication:

- Startup/process overhead dominates runtime in this mode.
- Even with one relevant test per mutant, total time remains high.

## Why Native Vitest Runner Fails Today

### Verified blockers in this repository

1. Mutation runner compatibility with Vite+ test API wrapper:

- Most tests import test APIs from `vite-plus/test`.
- Stryker Vitest runner expects mock APIs from `vitest`.
- Failure signature in dry-run:
  - `There are some problems in resolving the mocks API`
  - `import the mocks API directly from 'vitest'`

2. Related-test discovery instability in this workspace:

- With `vitest.related: true`, dry-run often reports no tests found for mutated files.
- Stryker warns to disable related mode or ensure direct source imports in test files.

3. JSDOM run path is currently too expensive when discovery fails:

- Full dry-run under JSDOM spent ~126s in environment setup before failing test discovery/execution.

## Source-Backed Constraints

The following behavior is documented by Stryker/Vitest:

1. Vitest runner config and options:

- `testRunner: "vitest"`, `vitest.configFile`, `vitest.dir`, `vitest.related`
- Source: Stryker Vitest runner docs
  - https://github.com/stryker-mutator/stryker-js/blob/master/docs/vitest-runner.md

2. Vitest runner limitation notes:

- Coverage analysis setting is ignored and Vitest runner uses `perTest`.
- Browser mode not supported in Vitest runner.
- Threads-off mode not currently supported.
- Source: Stryker Vitest runner docs
  - https://github.com/stryker-mutator/stryker-js/blob/master/docs/vitest-runner.md

3. Related-files troubleshooting guidance:

- If related-file matching fails, disable related mode or ensure direct imports from tests.
- Source: Stryker troubleshooting docs
  - https://github.com/stryker-mutator/stryker-js/blob/master/docs/troubleshooting.md

4. `vp test` behavior:

- `vp test` runs Vitest and forwards options.
- Source: Vite+ docs
  - https://github.com/voidzero-dev/vite-plus/blob/main/docs/guide/test.md
  - https://github.com/voidzero-dev/vite-plus/blob/main/docs/config/test.md

5. Vitest JSDOM and environment options:

- JSDOM is standard Vitest environment with configurable `environmentOptions`.
- Source: Vitest docs
  - https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/config/environment.md
  - https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/config/environmentoptions.md

## Runtime Estimation Model

Use this model for planning:

`TotalTime ~= InitialDryRun + (MutantCount * CostPerMutant)`

From measured smoke run:

- `InitialDryRun ~= 6.3s`
- `CostPerMutant ~= 0.98s` (command runner)

### Project-scale estimate (current path)

Approximate source size eligible for mutation:

- Non-test TS/TSX files: 91
- Non-test TS/TSX lines: ~6644

Using observed density (~1.56 mutants/line from smoke file as an upper-ish indicator), expected mutants can land in a broad range. Conservative planning range:

- ~5000 to ~10000 mutants

Projected runtime (command runner, current profile):

- 5000 mutants: ~82 minutes
- 10000 mutants: ~164 minutes

This is why incremental mode and phased mutate scopes are mandatory.

### Estimated savings if Vitest runner is made compatible

Primary gain source: avoid external process startup per mutant.

Planning range (until validated in-repo):

- 30% faster: 57 to 115 minutes saved per 5000 to 10000 mutants
- 50% faster: 82 to 164 minutes saved per 5000 to 10000 mutants

Decision threshold:

- If measured gain is under ~15%, keep command runner.
- If gain is >=30%, migrate fully to Vitest runner path.

## Canonical Strategy (Phased)

### Phase 1: Stable and Useful Now

- Keep command runner in sandbox mode for active mutation work.
- Keep incremental results enabled.
- Run mutation on curated critical modules first (3 to 5 files), not whole codebase.
- Add per-phase thresholds only after score/runtime stabilizes.

### Phase 2: Compatibility Slice for Fast Runner

Goal: make Vitest runner viable in this repo.

- Introduce mutation-only test API compatibility by eliminating `vite-plus/test` import dependency during mutation runs.
- Preferred durable fix: migrate tests to import APIs from `vitest` directly.
- Verify Stryker Vitest runner dry-run passes on same smoke scope.

Exit criteria:

- Dry-run executes tests successfully.
- Smoke mutation run completes without "no tests executed".

### Phase 3: JSDOM with Vitest Runner

- Validate mutation run on one JSDOM-heavy file set.
- Tune Vitest mutation config for low worker overhead (`maxWorkers: 1`, no watch, no CSS processing for tests where safe).
- Keep browser-mode tests out of mutation scope (Vitest runner limitation).

Exit criteria:

- JSDOM mutation smoke succeeds.
- Runtime shows at least 30% improvement against command-runner baseline.

### Phase 4: CI Rollout

- Add two lanes:
  - Fast mutation smoke on PRs (small curated mutate set).
  - Larger mutation batch on schedule/nightly.
- Keep full-repo mutation as periodic quality gate, not per-PR gate.

## Required Configuration Patterns

1. Use dedicated Vitest config for mutation runs.

- Keep deterministic settings (no watch, bounded workers, fixed include/exclude).

2. Keep mutation scopes explicit.

- Prefer explicit `mutate` arrays during rollout.
- Expand only after runtime remains acceptable.

3. Preserve incremental data.

- Keep `incremental: true` and stable incremental file path for iterative local runs.

4. Keep JSDOM targeted.

- Do not force JSDOM for modules that do not need DOM APIs.

## Operational Policy

- Mutation score target for critical logic: >=80%.
- Equivalent mutants should be reviewed and documented when excluded.
- Survived mutants are backlog items with owner and rationale.

## Immediate Next Actions

1. Keep current command-runner smoke in active use.
2. Create a focused compatibility branch to migrate test imports from `vite-plus/test` to `vitest` (or provide a mutation-only compatibility shim if migration risk is high).
3. Re-run smoke benchmark on Vitest runner after compatibility change; record before/after runtime in this document.
4. If speedup >=30%, promote Vitest runner to primary mutation path.
