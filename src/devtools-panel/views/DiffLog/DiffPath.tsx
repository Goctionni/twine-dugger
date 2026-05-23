import { isPathFiltered } from '@/devtools-panel/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { Path } from '@/shared/shared-types';

import { createContextMenuHandler } from '../../ui/util/ContextMenu';

export function DiffPath(props: {
  path: Path;
  onClick: () => void;
  onAddFilter: (path: Path) => void;
  action?: 'added' | 'removed';
  leafKey?: Path[number];
}) {
  const fullPath = () =>
    props.leafKey === undefined ? props.path : [...props.path, props.leafKey];

  const onContextMenu = createContextMenuHandler(
    getParentPaths(fullPath()).map((path) => ({
      label: () => (
        <>
          Filter out changes to "
          <PrettyPath path={path} class="font-mono" globSuffix />"
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
      <PrettyPath path={fullPath()} action={props.action} />
    </code>
  );
}

function getParentPaths(path: Path): Path[] {
  return path.map((_, index) => path.slice(0, index + 1));
}
