import type { JSX } from '@solidjs/web';

import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { Inspector } from '../Inspector/Inspector';
import type { SelectionKind } from '../types';

interface Props {
  /** The path the breadcrumbs show */
  path: string[];
  selectionKind: SelectionKind;
  children: JSX.Element;
}

/** What the navigators share: the breadcrumbs across the top, then the navigator and the inspector */
export function NavFrame(props: Props) {
  return (
    <div class="flex h-full flex-col">
      <Breadcrumbs path={props.path} />
      <div class="flex min-h-0 flex-1">
        <div class="min-w-0 flex-1 overflow-auto">{props.children}</div>
        <Inspector selectionKind={props.selectionKind} />
      </div>
    </div>
  );
}
