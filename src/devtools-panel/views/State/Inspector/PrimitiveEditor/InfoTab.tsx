import { Show, createMemo } from 'solid-js';

import { getLastChangeId, getLatestId, getLatestState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, getLockRange } from '@/devtools-panel/store/locks';
import { getJsonType, getPathValue, isContainer } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getNodeName } from '../../logic/get-node-name';
import { createValueHistory } from '../createValueHistory';
import { getLockingPath } from '../logic/edit-status';
import {
  describeAge,
  describeLength,
  describeType,
  formatAsJson,
  getPosition,
} from '../logic/info';
import { describeChangeCount, describeRange } from '../logic/value-history';

interface Props {
  path: Path;
  onSelect: (path: Path) => void;
}

export function InfoTab(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getHistory = createValueHistory(() => props.path);
  const getType = createMemo(() => getJsonType(getValue()));

  const getParentPath = () => props.path.slice(0, -1);
  const getParentName = () => getNodeName(getLatestState(), getParentPath());
  const getPlace = () => {
    const parent = getPathValue(getLatestState(), getParentPath());
    return isContainer(parent) ? getPosition(parent, props.path.at(-1)!) : undefined;
  };

  const getLockedText = () => {
    const lockingPath = getLockingPath(props.path, getLockedPaths());
    if (!lockingPath) return 'no';
    if (lockingPath.length === props.path.length) {
      const range = getLockRange(props.path);
      return range && range.min !== range.max ? `yes · ${range.min} – ${range.max}` : 'yes';
    }
    return `via ${getNodeName(getLatestState(), lockingPath)}`;
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

      <dt class="text-gray-400">Changes seen</dt>
      <dd>{describeChangeCount(getHistory())}</dd>

      <Show when={describeRange(getHistory(), getValue())}>
        {(range) => (
          <>
            <dt class="text-gray-400">Range seen</dt>
            <dd>{range()}</dd>
          </>
        )}
      </Show>

      <dt class="text-gray-400">Locked</dt>
      <dd>{getLockedText()}</dd>
    </dl>
  );
}
