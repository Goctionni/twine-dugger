import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { createFilterMenuItems } from '@/devtools-panel/views/util/filter-path';
import { Path } from '@/shared/shared-types';

import { createContextMenuHandler } from '../../ui/util/ContextMenu';

type ContextMenuItem = {
  disabled?: boolean | (() => boolean);
  label: string | (() => string);
  onClick: () => void;
};

export function DiffPath(props: {
  path: Path;
  onClick: () => void;
  onAddFilter: (path: Path) => void;
  getExtraMenuItems?: (path: Path) => ContextMenuItem[];
  action?: 'added' | 'removed';
  leafKey?: Path[number];
}) {
  const fullPath = () =>
    props.leafKey === undefined ? props.path : [...props.path, props.leafKey];
  const onContextMenu = (event: MouseEvent) => {
    const path = fullPath();
    const menuItems = [
      ...createFilterMenuItems(path, props.onAddFilter),
      ...(props.getExtraMenuItems?.(path) ?? []),
    ];
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
