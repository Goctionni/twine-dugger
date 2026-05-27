import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface LocationCoordinate {
  line: number;
  column: number;
}

interface MutantLocation {
  start: LocationCoordinate;
  end: LocationCoordinate;
}

interface StrykerMutant {
  id: string;
  status: string;
  mutatorName: string;
  replacement?: string;
  location?: MutantLocation;
}

interface StrykerFile {
  language: string;
  source: string;
  mutants: StrykerMutant[];
}

interface StrykerReport {
  files: Record<string, StrykerFile>;
}

interface IncrementalCache {
  mutationTestResult?: StrykerReport;
}

interface SurvivorFileEntry {
  filePath: string;
  sourceLines: string[];
  survivors: StrykerMutant[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possiblePaths: string[] = [
  path.join(__dirname, '../reports/stryker-incremental.json'),
  path.join(__dirname, '../reports/mutation/stryker-incremental.json'),
  path.join(__dirname, '../.stryker-tmp/stryker-incremental.json'),
];

let rawData: IncrementalCache | null = null;

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    rawData = JSON.parse(fs.readFileSync(p, 'utf8')) as IncrementalCache;
    break;
  }
}

if (!rawData) {
  console.error('Could not find stryker-incremental.json anywhere.');
  process.exit(1);
}

const report = (rawData.mutationTestResult || rawData) as StrykerReport;
let totalSurvivors = 0;
let outputText = '';

const survivorEntries: SurvivorFileEntry[] = [];

Object.entries(report.files || {}).forEach(([filePath, fileData]) => {
  const mutantsArray: StrykerMutant[] = Array.isArray(fileData.mutants)
    ? fileData.mutants
    : Object.values(fileData.mutants || fileData || {});

  const fileSurvivors = mutantsArray.filter((m) => m && m.status === 'Survived');

  if (fileSurvivors.length === 0) {
    return;
  }

  const absoluteSourcePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '..', filePath);
  let originalFileLines: string[] = [];

  if (fs.existsSync(absoluteSourcePath)) {
    originalFileLines = fs.readFileSync(absoluteSourcePath, 'utf8').split(/\r?\n/);
  }

  survivorEntries.push({
    filePath,
    sourceLines: originalFileLines,
    survivors: fileSurvivors,
  });
});

survivorEntries.sort(
  (a, b) => b.survivors.length - a.survivors.length || a.filePath.localeCompare(b.filePath),
);

totalSurvivors = survivorEntries.reduce((sum, entry) => sum + entry.survivors.length, 0);

const mutatorCounts = survivorEntries
  .flatMap((entry) => entry.survivors)
  .reduce<Record<string, number>>((acc, mutant) => {
    const mutatorName = mutant.mutatorName ?? 'Unknown';
    acc[mutatorName] = (acc[mutatorName] ?? 0) + 1;
    return acc;
  }, {});

const sortedMutatorCounts = Object.entries(mutatorCounts).sort(
  (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
);

outputText += `Total Mutants: ${totalSurvivors}\n`;
outputText += 'Mutants per File (descending):\n';

survivorEntries.forEach((entry) => {
  outputText += `  ${entry.survivors.length} ${entry.filePath}\n`;
});

outputText += '\nMutants by Type (descending):\n';

sortedMutatorCounts.forEach(([mutatorName, count]) => {
  outputText += `  ${count} ${mutatorName}\n`;
});

outputText += '\nDetailed Surviving Mutants:\n';

survivorEntries.forEach((entry) => {
  const { filePath, sourceLines, survivors } = entry;
  const fileHeader = `\nFile: ${filePath} (${survivors.length})\n----------------------------------------\n`;
  outputText += fileHeader;

  survivors.forEach((m) => {
    const startLine = m.location?.start?.line ?? 0;
    const startCol = m.location?.start?.column ?? 0;
    const endLine = m.location?.end?.line ?? startLine;
    const mutator = m.mutatorName ?? 'Unknown';
    const replacement = m.replacement ?? '';

    const mutantDescriptor = `${mutator} ${startLine}:${startCol}`;
    outputText += mutantDescriptor + '\n';

    if (sourceLines.length > 0 && startLine > 0) {
      const snippetLines = sourceLines.slice(startLine - 1, endLine);

      snippetLines.forEach((lineText) => {
        const minusLine = `- ${lineText}`;
        outputText += minusLine + '\n';
      });

      const replacementLines = replacement.split(/\r?\n/);
      replacementLines.forEach((repLine) => {
        const originalIndentation = sourceLines[startLine - 1]?.match(/^\s*/)?.[0] || '';
        const plusLine = `+ ${originalIndentation}${repLine}`;
        outputText += plusLine + '\n';
      });
    } else {
      const fallbackText = `- [Original text missing]\n+ ${replacement}`;
      outputText += fallbackText + '\n';
    }

    outputText += '\n';
  });
});

const outputPath = path.join(__dirname, '../reports/survivors-list.txt');
fs.writeFileSync(outputPath, outputText, 'utf8');

console.log(`Total Mutants: ${totalSurvivors}`);
console.log('Mutants per File (descending):');

// limit to top 10 files for console output
survivorEntries.slice(0, 10).forEach((entry) => {
  console.log(`  ${entry.survivors.length} ${entry.filePath}`);
});
if (survivorEntries.length > 10) {
  console.log(`...and ${survivorEntries.length - 10} more files.`);
}

console.log('Report saved to: reports/survivors-list.txt');
