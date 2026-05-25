import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  createDefaultScanConfig,
  findMissingTests,
  formatMissingTestsReport,
} from './find-missing-tests';

describe('findMissingTests', () => {
  it('should list files missing colocated tests', () => {
    const workspace = createFixtureWorkspace({
      'src/a/has-test.ts': 'export const hasTest = true;',
      'src/a/has-test.test.ts': 'import { describe } from "vite-plus/test";',
      'src/a/missing.ts': 'export const missing = true;',
      'src/b/also-missing.tsx': 'export const AlsoMissing = () => null;',
      'src/b/has-spec.ts': 'export const hasSpec = true;',
      'src/b/has-spec.spec.tsx': 'export const test = true;',
      'src/types/global.d.ts': 'declare const __DEV__: boolean;',
    });

    try {
      const config = createDefaultScanConfig(workspace);
      const missingFiles = findMissingTests(config);

      expect(missingFiles).toEqual(['src/a/missing.ts', 'src/b/also-missing.tsx']);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('should support configurable source roots', () => {
    const workspace = createFixtureWorkspace({
      'src/ignored/no-test.ts': 'export const noTest = true;',
      'packages/pkg-a/index.ts': 'export const pkgA = true;',
      'packages/pkg-a/index.test.ts': 'export const test = true;',
      'packages/pkg-b/entry.tsx': 'export const Entry = () => null;',
    });

    try {
      const config = createDefaultScanConfig(workspace);
      config.sourceRoots = ['packages'];

      const missingFiles = findMissingTests(config);

      expect(missingFiles).toEqual(['packages/pkg-b/entry.tsx']);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('should format an empty report clearly', () => {
    expect(formatMissingTestsReport([])).toBe(
      'No missing tests found for configured source files.',
    );
  });
});

function createFixtureWorkspace(files: Record<string, string>): string {
  const workspace = mkdtempSync(join(tmpdir(), 'twine-dugger-missing-tests-'));

  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = join(workspace, relativePath);
    const parentDir = dirname(absolutePath);

    mkdirSync(parentDir, { recursive: true });
    writeFileSync(absolutePath, contents);
  }

  return workspace;
}
