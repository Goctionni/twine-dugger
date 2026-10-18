import { Repeat, createMemo } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { requestReveal } from '@/devtools-panel/store/state-location';
import { getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import type { NavProps } from '../../types';
import { NavFrame } from '../NavFrame';
import { getVisibleKeys } from '../Shared/visible-keys';
import { countColumns } from './logic/count-columns';
import type { ArrowKey } from './logic/key-target';
import { getKeyTarget } from './logic/key-target';
import { nextTrail } from './logic/next-trail';
import { getRowId } from './logic/row-id';
import { MillerColumn } from './MillerColumn';

const isArrowKey = (key: string): key is ArrowKey =>
  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);

export function MillerNav(props: NavProps) {
  const treeId = `miller-${crypto.randomUUID()}`;

  const getColumnCount = createMemo(() =>
    countColumns(getLatestState(), props.path, getHiddenTypes()),
  );

  // A copy: the path in the store is changed in place, and the trail has to keep what it was
  const getTrail = createMemo<Path>((trail) => nextTrail(trail ?? [], props.path.slice()));

  const getKeysAt = (containerPath: Path) =>
    getVisibleKeys(
      getPathValue(getLatestState(), containerPath),
      getSort(),
      getHiddenTypes(),
      (key) => getLastChangeId([...containerPath, key]),
    );

  const getActiveRowId = () =>
    props.path.length ? getRowId(treeId, props.path.length - 1, props.path.at(-1)!) : undefined;

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (!isArrowKey(event.key)) return;
    event.preventDefault();

    const target = getKeyTarget(event.key, props.path, getTrail(), getKeysAt);
    if (!target) return;
    props.onSelect(target);
    requestReveal();
  }

  return (
    <NavFrame {...props}>
      <div
        role="tree"
        aria-label="State"
        tabindex="0"
        aria-activedescendant={getActiveRowId()}
        onKeyDown={onKeyDown}
        onFocusIn={(event) => {
          if (event.target !== event.currentTarget) event.currentTarget.focus();
        }}
        class="flex h-full overflow-x-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500"
      >
        <Repeat count={getColumnCount()}>
          {(depth) => (
            <MillerColumn
              treeId={treeId}
              depth={depth}
              path={props.path}
              trail={getTrail()}
              onSelect={props.onSelect}
            />
          )}
        </Repeat>
      </div>
    </NavFrame>
  );
}
