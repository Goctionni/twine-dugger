import type { NavProps } from '../types';
import { NavFrame } from './NavFrame';

export function MillerNav(props: NavProps) {
  return (
    <NavFrame path={props.path} selectionKind={props.selectionKind}>
      <div class="p-3 text-gray-400">Miller columns</div>
    </NavFrame>
  );
}
