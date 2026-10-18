import { Show, createMemo } from 'solid-js';

import { getLastChangeId, getLatestId, getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths } from '@/devtools-panel/store/locks';
import { getJsonType, getPathValue, isContainer } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { getLockingPath } from '../logic/edit-status';
import {
  describeAge,
  describeLength,
  describeType,
  formatAsJson,
  getPosition,
} from '../logic/info';

interface Props {
  path: Path;
  onSelect: (path: Path) => void;
}

export function InfoTab(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));

  const getParentPath = () => props.path.slice(0, -1);
  const getParentName = () => getPathLabels(getLatestState(), getParentPath()).at(-1) ?? 'State';
  const getPlace = () => {
    const parent = getPathValue(getLatestState(), getParentPath());
    return isContainer(parent) ? getPosition(parent, props.path.at(-1)!) : undefined;
  };

  const getLockedText = () => {
    const lockingPath = getLockingPath(props.path, getLockedPaths());
    if (!lockingPath) return 'no';
    if (lockingPath.length === props.path.length) return 'yes';
    return `via ${getPathLabels(getLatestState(), lockingPath).at(-1)}`;
  };

  return (
    <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
      <dt class="text-gray-400">Type</dt>
      <dd>{describeType(getValue(), getType())}</dd>

      <Show when={getType() === 'string'}>
        <dt class="text-gray-400">Length</dt>
        <dd>{describeLength(getValue() as string)}</dd>
      </Show>

      <dt class="text-gray-400">As JSON</dt>
      <dd>
        <code class="font-mono break-all">{formatAsJson(getValue())}</code>
      </dd>

      <dt class="text-gray-400">In</dt>
      <dd>
        <button
          type="button"
          class="cursor-pointer text-sky-400 hover:underline"
          onClick={() => props.onSelect(getParentPath())}
        >
          {getParentName()}
        </button>
        <Show when={getPlace()}>
          {(place) => (
            <span>
              {' '}
              · {place().index} of {place().total}
            </span>
          )}
        </Show>
      </dd>

      <dt class="text-gray-400">Last change</dt>
      <dd>{describeAge(getLatestId(), getLastChangeId(props.path))}</dd>

      <dt class="text-gray-400">Locked</dt>
      <dd>{getLockedText()}</dd>
    </dl>
  );
}
