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
  const onContextMenu = createContextMenuHandler([
    {
      label: `Filter out changes to "${fullPath().join('.')}"`,
      onClick: () => props.onAddFilter(fullPath()),
    },
  ]);

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
