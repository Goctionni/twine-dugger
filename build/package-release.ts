import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { ZipArchive } from 'archiver';

const releasesDir = 'releases';

const run = (command: string, args: string[]) => execFileSync(command, args, { stdio: 'inherit' });
const getBuiltVersion = () => {
  const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8')) as {
    version: string;
    version_name?: string;
  };
  return manifest.version_name ?? manifest.version;
};
const outFile = (suffix: string) =>
  join(releasesDir, `twine-dugger-${getBuiltVersion()}-${suffix}.zip`);

function createZip(outputPath: string, fill: (archive: ZipArchive) => void) {
  return new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    fill(archive);
    archive.finalize().catch(reject);
  });
}

const zipDirectory = (directory: string, outputPath: string) =>
  createZip(outputPath, (archive) => archive.directory(directory, false));

function zipSourceCode(outputPath: string) {
  const listed = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const files = listed.split('\n').filter((file) => file && existsSync(file));

  return createZip(outputPath, (archive) => {
    for (const file of files) archive.file(file, { name: file });
  });
}

rmSync('dist-ff', { recursive: true, force: true });
run('npx', ['vp', 'build']);

mkdirSync(releasesDir, { recursive: true });
for (const suffix of ['chrome', 'ff', 'sourcecode']) rmSync(outFile(suffix), { force: true });

await zipDirectory('dist', outFile('chrome'));
await zipDirectory('dist-ff', outFile('ff'));
await zipSourceCode(outFile('sourcecode'));

console.log(`Release files for ${getBuiltVersion()} written to ${releasesDir}/`);
