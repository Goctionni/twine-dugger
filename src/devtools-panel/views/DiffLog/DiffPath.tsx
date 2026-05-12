import { addWatchlistPath, getWatchlistPaths } from '@/devtools-panel/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { pathEquals } from '@/shared/path-equals';
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
    const isWatchlisted = () => getWatchlistPaths().some((item) => pathEquals(item, path));

    createContextMenuHandler([
      {
        label: `Filter out changes to "${path.join('.')}"`,
        onClick: () => props.onAddFilter(path),
      },
      {
        label: () =>
          isWatchlisted()
            ? `Already in watchlist: "${path.join('.')}"`
            : `Add "${path.join('.')}" to watchlist`,
        onClick: () => addWatchlistPath(path),
        disabled: () => isWatchlisted(),
      },
    ])(event);
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
