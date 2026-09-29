import { isPathFiltered } from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import type { ContainerType } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { createContextMenuHandler } from '../../ui/util/ContextMenu';

export function DiffPath(props: {
  path: Path;
  kinds: ContainerType[];
  onClick: () => void;
  onAddFilter: (path: Path) => void;
  action?: 'added' | 'removed';
}) {
  // A change never changes, so the menu is built once
  const onContextMenu = createContextMenuHandler(
    // oxlint-disable-next-line solid/reactivity
    getParentPaths(props.path).map((path) => ({
      label: () => (
        <>
          Filter out changes to "
          <PrettyPath path={path} kinds={props.kinds} class="font-mono" globSuffix />"
        </>
      ),
      onClick: () => props.onAddFilter(path),
      disabled: () => isPathFiltered(path),
    })),
  );

  return (
    <code
      onContextMenu={onContextMenu}
      onClick={() => props.onClick()}
      class="cursor-pointer hover:underline"
    >
      <PrettyPath path={props.path} kinds={props.kinds} action={props.action} />
    </code>
  );
}

function getParentPaths(path: Path): Path[] {
  return path.map((_, index) => path.slice(0, index + 1));
}
