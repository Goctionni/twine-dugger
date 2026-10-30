import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { getStripId } from './logic/row-id';

interface Props {
  treeId: string;
  depth: number;
  path: Path;
  onSelect: (path: Path) => void;
}

/** A column that did not fit: the container that it shows the values of, to select it again */
export function MillerStrip(props: Props) {
  const getColumnPath = createMemo(() => props.path.slice(0, props.depth), { equals: pathEquals });
  const getLabels = () => getPathLabels(getLatestState(), getColumnPath());
  const getTitle = () => getLabels().at(-1) ?? 'State';
  const getType = createMemo(() => getJsonType(getPathValue(getLatestState(), getColumnPath())));

  return (
    <div
      id={getStripId(props.treeId, props.depth)}
      role="treeitem"
      aria-level={props.depth + 1}
      aria-expanded="true"
      aria-selected="false"
      aria-label={getTitle()}
      title={['State', ...getLabels()].join(' › ')}
      class="flex w-7.5 flex-none cursor-pointer flex-col items-center gap-2 border-r border-gray-700 bg-slate-900 py-1.5 text-sky-400 select-none hover:bg-gray-800"
      onClick={() => props.onSelect(getColumnPath())}
    >
      <TypeIcon type={getType()} />
      <span class="max-h-full overflow-hidden font-mono text-xs text-ellipsis whitespace-nowrap [writing-mode:vertical-rl]">
        {getTitle()}
      </span>
    </div>
  );
}
