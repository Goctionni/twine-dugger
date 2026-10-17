import { createSignal } from 'solid-js';

import type { NavProps } from '../types';
import { NavFrame } from './NavFrame';

export function TilesNav(props: NavProps) {
  // Placeholder: the container the tiles show starts as the one holding the selected value
  const [getTilesPath] = createSignal(() => props.path.slice(0, -1));

  return (
    <NavFrame path={getTilesPath()} selectionKind={props.selectionKind} onSelect={props.onSelect}>
      <div class="p-3 text-gray-400">Tiles</div>
    </NavFrame>
  );
}
