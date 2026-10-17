import type { NavProps } from '../types';
import { NavFrame } from './NavFrame';

export function TreeNav(props: NavProps) {
  return (
    <NavFrame {...props}>
      <div class="p-3 text-gray-400">Tree</div>
    </NavFrame>
  );
}
