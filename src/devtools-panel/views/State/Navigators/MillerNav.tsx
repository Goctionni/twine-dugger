import { Repeat, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import type { Path } from '@/shared/shared-types';

import { countColumns } from '../logic/count-columns';
import { nextTrail } from '../logic/next-trail';
import { getHiddenTypes } from '../store-helpers/view-prefs';
import type { NavProps } from '../types';
import { MillerColumn } from './MillerColumn';
import { NavFrame } from './NavFrame';

export function MillerNav(props: NavProps) {
  const getColumnCount = createMemo(() =>
    countColumns(getLatestState(), props.path, getHiddenTypes()),
  );

  // A copy: the path in the store is changed in place, and the trail has to keep what it was
  const getTrail = createMemo<Path>((trail) => nextTrail(trail ?? [], props.path.slice()));

  return (
    <NavFrame {...props}>
      <div class="flex h-full overflow-x-auto">
        <Repeat count={getColumnCount()}>
          {(depth) => (
            <MillerColumn
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
