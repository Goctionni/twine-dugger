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

interface SurvivorMutantRecord {
  key: string;
  filePath: string;
  mutatorName: string;
  line: number;
  column: number;
}

interface SurvivorsSnapshot {
  generatedAt: string;
  totalSurvivors: number;
  fileCounts: Record<string, number>;
  mutantRecords: SurvivorMutantRecord[];
}

interface ChangedFileEntry {
  filePath: string;
  previous: number;
  current: number;
  delta: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportOutputPath = path.join(__dirname, '../reports/survivors-list.txt');
const snapshotOutputPath = path.join(__dirname, '../reports/survivors-snapshot.json');

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
let previousSnapshot: SurvivorsSnapshot | null = null;

if (fs.existsSync(snapshotOutputPath)) {
  try {
    previousSnapshot = JSON.parse(fs.readFileSync(snapshotOutputPath, 'utf8')) as SurvivorsSnapshot;
  } catch {
    previousSnapshot = null;
  }
}

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

const currentMutantRecords: SurvivorMutantRecord[] = survivorEntries
  .flatMap((entry) =>
    entry.survivors.map((mutant) => {
      const line = mutant.location?.start?.line ?? 0;
      const column = mutant.location?.start?.column ?? 0;
      const mutatorName = mutant.mutatorName ?? 'Unknown';
      const key = `${entry.filePath}|${mutatorName}|${line}:${column}`;

      return {
        key,
        filePath: entry.filePath,
        mutatorName,
        line,
        column,
      };
    }),
  )
  .sort(
    (a, b) =>
      a.filePath.localeCompare(b.filePath) ||
      a.mutatorName.localeCompare(b.mutatorName) ||
      a.line - b.line ||
      a.column - b.column,
  );

const currentFileCounts = Object.fromEntries(
  survivorEntries.map((entry) => [entry.filePath, entry.survivors.length]),
);

const previousFileCounts = previousSnapshot?.fileCounts ?? {};
const changedFiles: ChangedFileEntry[] = Array.from(
  new Set([...Object.keys(previousFileCounts), ...Object.keys(currentFileCounts)]),
)
  .map((filePath) => {
    const previous = previousFileCounts[filePath] ?? 0;
    const current = currentFileCounts[filePath] ?? 0;
    return {
      filePath,
      previous,
      current,
      delta: current - previous,
    };
  })
  .filter((entry) => entry.delta !== 0)
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.filePath.localeCompare(b.filePath));

const previousMutantMap = new Map(
  (previousSnapshot?.mutantRecords ?? []).map((record) => [record.key, record]),
);
const currentMutantMap = new Map(currentMutantRecords.map((record) => [record.key, record]));

const addedMutants = currentMutantRecords
  .filter((record) => !previousMutantMap.has(record.key))
  .sort(
    (a, b) =>
      a.filePath.localeCompare(b.filePath) ||
      a.mutatorName.localeCompare(b.mutatorName) ||
      a.line - b.line ||
      a.column - b.column,
  );

const removedMutants = (previousSnapshot?.mutantRecords ?? [])
  .filter((record) => !currentMutantMap.has(record.key))
  .sort(
    (a, b) =>
      a.filePath.localeCompare(b.filePath) ||
      a.mutatorName.localeCompare(b.mutatorName) ||
      a.line - b.line ||
      a.column - b.column,
  );

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

outputText += '\nChanges Since Previous Run:\n';

if (!previousSnapshot) {
  outputText += '  No previous run snapshot.\n';
} else if (changedFiles.length === 0 && addedMutants.length === 0 && removedMutants.length === 0) {
  outputText += '  No Changes\n';
} else {
  outputText += 'Changed Files:\n';
  if (changedFiles.length === 0) {
    outputText += '  None\n';
  } else {
    changedFiles.forEach((entry) => {
      const deltaPrefix = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`;
      outputText += `  ${deltaPrefix} ${entry.filePath} (${entry.previous} -> ${entry.current})\n`;
    });
  }

  outputText += 'Changed Mutants:\n';
  if (addedMutants.length === 0 && removedMutants.length === 0) {
    outputText += '  None\n';
  } else {
    removedMutants.forEach((record) => {
      outputText += `  -1 ${record.filePath} ${record.mutatorName} ${record.line}:${record.column}\n`;
    });
    addedMutants.forEach((record) => {
      outputText += `  +1 ${record.filePath} ${record.mutatorName} ${record.line}:${record.column}\n`;
    });
  }
}

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

fs.writeFileSync(reportOutputPath, outputText, 'utf8');

const snapshotData: SurvivorsSnapshot = {
  generatedAt: new Date().toISOString(),
  totalSurvivors,
  fileCounts: currentFileCounts,
  mutantRecords: currentMutantRecords,
};
fs.writeFileSync(snapshotOutputPath, JSON.stringify(snapshotData, null, 2) + '\n', 'utf8');

console.log(`Total Mutants: ${totalSurvivors}`);
console.log('Mutants per File (descending):');

// limit to top 10 files for console output
survivorEntries.slice(0, 10).forEach((entry) => {
  console.log(`  ${entry.survivors.length} ${entry.filePath}`);
});
if (survivorEntries.length > 10) {
  console.log(`...and ${survivorEntries.length - 10} more files.`);
}

console.log('Changes Since Previous Run:');
if (!previousSnapshot) {
  console.log('  No previous run snapshot.');
} else if (changedFiles.length === 0 && addedMutants.length === 0 && removedMutants.length === 0) {
  console.log('  No Changes');
} else {
  console.log('Changed Files:');
  if (changedFiles.length === 0) {
    console.log('  None');
  } else {
    changedFiles.slice(0, 10).forEach((entry) => {
      const deltaPrefix = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`;
      console.log(`  ${deltaPrefix} ${entry.filePath} (${entry.previous} -> ${entry.current})`);
    });
    if (changedFiles.length > 10) {
      console.log(`...and ${changedFiles.length - 10} more changed files.`);
    }
  }

  console.log('Changed Mutants:');
  const changedMutantsPreview = [
    ...removedMutants.map((record) => ({ sign: '-1', record })),
    ...addedMutants.map((record) => ({ sign: '+1', record })),
  ];

  if (changedMutantsPreview.length === 0) {
    console.log('  None');
  } else {
    changedMutantsPreview.slice(0, 20).forEach(({ sign, record }) => {
      console.log(
        `  ${sign} ${record.filePath} ${record.mutatorName} ${record.line}:${record.column}`,
      );
    });
    if (changedMutantsPreview.length > 20) {
      console.log(`...and ${changedMutantsPreview.length - 20} more changed mutants.`);
    }
  }
}

console.log('Report saved to: reports/survivors-list.txt');
