import type { NavProps } from '../types';
import { NavFrame } from './NavFrame';

export function TreeNav(props: NavProps) {
  return (
    <NavFrame path={props.path} selectionKind={props.selectionKind} onSelect={props.onSelect}>
      <div class="p-3 text-gray-400">Tree</div>
    </NavFrame>
  );
}
