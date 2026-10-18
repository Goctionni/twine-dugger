import type { JSX } from '@solidjs/web';

import { requestReveal } from '@/devtools-panel/store/state-location';
import type { Path } from '@/shared/shared-types';

import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { Inspector } from '../Inspector/Inspector';
import type { NavProps } from '../types';

interface Props extends NavProps {
  children: JSX.Element;
}

/** What the navigators share: the breadcrumbs across the top, then the navigator and the inspector */
export function NavFrame(props: Props) {
  // For what is not a row of the navigator: the selection may be out of view
  const selectAndReveal = (path: Path) => {
    props.onSelect(path);
    requestReveal();
  };

  return (
    <div class="flex h-full flex-col">
      <Breadcrumbs path={props.path} onSelect={selectAndReveal} />
      <div class="relative flex min-h-0 flex-1 inspector-sheet:flex-col">
        <div class="min-h-0 min-w-0 flex-1 overflow-auto">{props.children}</div>
        <Inspector
          path={props.path}
          onSelect={selectAndReveal}
          selectionKind={props.selectionKind}
          isOverlayOpen={props.isOverlayOpen}
          onClose={props.onCloseOverlay}
        />
      </div>
    </div>
  );
}
