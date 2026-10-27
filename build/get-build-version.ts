import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import packageJson from '../package.json' with { type: 'json' };

const changesetDir = '.changeset';
const bumps = ['patch', 'minor', 'major'] as const;
type Bump = (typeof bumps)[number];

export interface BuildVersion {
  /** What the browsers read as the version: Chrome only takes up to four numbers */
  version: string;
  /** What people see, with `-beta` when the code is not a tagged release */
  versionName: string;
  /** Firefox takes no text after the numbers, so a beta is 0.major.minor.patch, below any release */
  firefoxVersion: string;
}

/** Git failing, hanging or having no such tag counts as a difference */
function matchesReleaseTag(version: string) {
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  try {
    git('diff', '--quiet', `v${version}`);
    return git('ls-files', '--others', '--exclude-standard').trim() === '';
  } catch {
    return false;
  }
}

function getChangesetBump(): Bump | undefined {
  let highest = -1;
  for (const file of readdirSync(changesetDir)) {
    if (!file.endsWith('.md') || file === 'README.md') continue;
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(
      readFileSync(join(changesetDir, file), 'utf8'),
    );
    const bump = new RegExp(`['"]?${packageJson.name}['"]?\\s*:\\s*(\\w+)`).exec(
      frontmatter?.[1] ?? '',
    )?.[1];
    highest = Math.max(highest, bumps.indexOf(bump as Bump));
  }
  return bumps[highest];
}

export function bumpVersion(version: string, bump: Bump) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (bump === 'major') return `${major! + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor! + 1}.0`;
  return `${major}.${minor}.${patch! + 1}`;
}

function decideBuildVersion(): BuildVersion {
  const current = packageJson.version;
  if (matchesReleaseTag(current))
    return { version: current, versionName: current, firefoxVersion: current };

  const version = bumpVersion(current, getChangesetBump() ?? 'patch');
  return { version, versionName: `${version}-beta`, firefoxVersion: `0.${version}` };
}

// Once per run: a watch build builds again on every change, and the answer should not change midway
let buildVersion: BuildVersion | undefined;
export const getBuildVersion = () => (buildVersion ??= decideBuildVersion());
