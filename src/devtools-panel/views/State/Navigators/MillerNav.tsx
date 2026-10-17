import { Repeat, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';

import { countColumns } from '../logic/count-columns';
import type { NavProps } from '../types';
import { MillerColumn } from './MillerColumn';
import { NavFrame } from './NavFrame';

export function MillerNav(props: NavProps) {
  const getColumnCount = createMemo(() => countColumns(getLatestState(), props.path));

  return (
    <NavFrame path={props.path} selectionKind={props.selectionKind}>
      <div class="flex h-full overflow-x-auto">
        <Repeat count={getColumnCount()}>
          {(depth) => <MillerColumn depth={depth} path={props.path} onSelect={props.onSelect} />}
        </Repeat>
      </div>
    </NavFrame>
  );
}
