import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { createFilterMenuItems } from '@/devtools-panel/views/util/filter-path';
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
  const onContextMenu = (event: MouseEvent) => {
    const path = fullPath();

    // Merge note: watchlist branch also edits this menu.
    // Keep filter items in this branch, then append watchlist item after this array.
    const filterItems = createFilterMenuItems(path, props.onAddFilter);
    const menuItems = [...filterItems];

    createContextMenuHandler(menuItems)(event);
  };

  return (
    <code
      onContextMenu={onContextMenu}
      onClick={() => props.onClick()}
      class="hover:underline cursor-pointer"
    >
      <PrettyPath path={fullPath()} action={props.action} />
    </code>
  );
}
