import { For } from 'solid-js';

import { getMockColumns } from '../mock-state';
import type { NavProps } from '../types';
import { MillerColumn } from './MillerColumn';
import { NavFrame } from './NavFrame';

export function MillerNav(props: NavProps) {
  return (
    <NavFrame path={props.path} selectionKind={props.selectionKind}>
      <div class="flex h-full overflow-x-auto">
        <For each={getMockColumns(props.path)}>
          {(column, index) => (
            <MillerColumn
              column={column}
              depth={index()}
              path={props.path}
              onSelect={props.onSelect}
            />
          )}
        </For>
      </div>
    </NavFrame>
  );
}
