import { existsSync, readdirSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface MissingTestsScanConfig {
  repoRoot: string;
  sourceRoots: string[];
  sourceExtensions: string[];
  testExtensions: string[];
  testNameParts: string[];
  ignoredDirectories: string[];
  ignoredFilePatterns: RegExp[];
}

export function createDefaultScanConfig(repoRoot = process.cwd()): MissingTestsScanConfig {
  return {
    repoRoot,
    sourceRoots: ['src'],
    sourceExtensions: ['.ts', '.tsx'],
    testExtensions: ['.ts', '.tsx'],
    testNameParts: ['test', 'spec'],
    ignoredDirectories: ['.git', 'node_modules', 'dist', 'coverage', 'test-results'],
    ignoredFilePatterns: [/\.d\.ts$/],
  };
}

export function findMissingTests(config: MissingTestsScanConfig): string[] {
  const discoveredFiles = listDiscoveredFiles(config);
  const sourceFiles = discoveredFiles.filter((filePath) => isSourceFile(filePath, config));
  const normalizedFileSet = new Set(
    discoveredFiles.map((filePath) => normalizePath(filePath).toLowerCase()),
  );

  return sourceFiles
    .filter((sourceFile) => !hasColocatedTest(sourceFile, normalizedFileSet, config))
    .map((sourceFile) => normalizePath(relative(config.repoRoot, sourceFile)))
    .sort((a, b) => a.localeCompare(b));
}

export function formatMissingTestsReport(missingFiles: string[]): string {
  if (missingFiles.length === 0) {
    return 'No missing tests found for configured source files.';
  }

  const header = `Missing tests (${missingFiles.length}):`;
  const lines = missingFiles.map((filePath) => `- ${filePath}`);
  return [header, ...lines].join('\n');
}

function listSourceFiles(config: MissingTestsScanConfig): string[] {
  const files: string[] = [];

  for (const sourceRoot of config.sourceRoots) {
    const absoluteRoot = resolve(config.repoRoot, sourceRoot);
    if (!existsSync(absoluteRoot)) continue;

    collectCandidateFiles(absoluteRoot, files, config);
  }

  return files;
}

function collectCandidateFiles(
  currentDir: string,
  out: string[],
  config: MissingTestsScanConfig,
): void {
  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (config.ignoredDirectories.includes(entry.name)) continue;
      collectCandidateFiles(join(currentDir, entry.name), out, config);
      continue;
    }

    const absolutePath = join(currentDir, entry.name);
    const normalizedAbsolutePath = normalizePath(absolutePath);

    const extension = extname(normalizedAbsolutePath);
    if (!config.sourceExtensions.includes(extension)) continue;
    if (config.ignoredFilePatterns.some((pattern) => pattern.test(normalizedAbsolutePath)))
      continue;

    out.push(absolutePath);
  }
}

function listDiscoveredFiles(config: MissingTestsScanConfig): string[] {
  return listSourceFiles(config).map((filePath) => normalizePath(filePath));
}

function isSourceFile(filePath: string, config: MissingTestsScanConfig): boolean {
  const extension = extname(filePath);
  if (!config.sourceExtensions.includes(extension)) return false;
  if (config.ignoredFilePatterns.some((pattern) => pattern.test(filePath))) return false;

  const fileName = basename(filePath);
  for (const part of config.testNameParts) {
    for (const testExtension of config.testExtensions) {
      if (fileName.endsWith(`.${part}${testExtension}`)) return false;
    }
  }

  return true;
}

function hasColocatedTest(
  sourceFile: string,
  normalizedFileSet: Set<string>,
  config: MissingTestsScanConfig,
): boolean {
  const sourceExtension = extname(sourceFile);
  const withoutExtension = sourceFile.slice(0, sourceFile.length - sourceExtension.length);

  for (const part of config.testNameParts) {
    for (const testExtension of config.testExtensions) {
      const testPath = `${withoutExtension}.${part}${testExtension}`;
      if (normalizedFileSet.has(normalizePath(testPath).toLowerCase())) return true;
    }
  }

  return false;
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll('\\', '/');
}

function isExecutedAsScript(): boolean {
  const processArgvPath = process.argv[1];
  if (!processArgvPath) return false;
  return resolve(processArgvPath) === fileURLToPath(import.meta.url);
}

if (isExecutedAsScript()) {
  const config = createDefaultScanConfig();
  const missingFiles = findMissingTests(config);
  process.stdout.write(`${formatMissingTestsReport(missingFiles)}\n`);
}
