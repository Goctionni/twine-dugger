import { For, Show, createMemo, createSignal } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { isPinned } from '@/devtools-panel/store/store';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getPathValue } from '@/shared/json-safe';
import { pathEquals } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import type { NavProps } from '../../types';
import { provideNavigatorInfo } from '../navigator-info';
import { createScrollToSelection } from '../Shared/create-scroll-to-selection';
import { getTypesIn } from '../Shared/get-types-in';
import { getVisibleKeys } from '../Shared/visible-keys';
import { Tile } from './Tile';
import { resolveTilesViewPath } from './tiles-view-path';
import { UpTile } from './UpTile';

export function TilesNav(props: NavProps) {
  const getSelectedPath = createStablePath(() => props.path);
  // The container that the tiles show. It follows the selection when that goes somewhere else, and
  // keeps its own value while the selection is in it
  const [getViewPath, setViewPath] = createSignal((view: Path | undefined) =>
    resolveTilesViewPath(getLatestState(), getSelectedPath(), view),
  );
  const getParentPath = () => getViewPath().slice(0, -1);

  provideNavigatorInfo({
    getBreadcrumbsPath: getViewPath,
    getAvailableTypes: () => getTypesIn(getPathValue(getLatestState(), getViewPath())),
  });

  const open = (path: Path) => {
    setViewPath(path);
    props.onSelect(path);
  };
  // The container that it was in is selected
  const goUp = () => {
    const cameFrom = getViewPath();
    setViewPath(getParentPath());
    props.onSelect(cameFrom);
  };

  const getKeys = createMemo(
    () =>
      getVisibleKeys(
        getPathValue(getLatestState(), getViewPath()),
        getSort(),
        getHiddenTypes(),
        (key) => getLastChangeId([...getViewPath(), key]),
        (key) => isPinned([...getViewPath(), key]),
      ),
    { equals: sameItems },
  );

  const getUpName = () => getPathLabels(getLatestState(), getParentPath()).at(-1) ?? 'State';

  // The view itself has no tile: when it is selected, nothing is
  const isSelectedTileShown = () => {
    const isViewChild = pathEquals(getSelectedPath().slice(0, -1), getViewPath());
    return !isViewChild || getKeys().includes(getSelectedPath().at(-1)!);
  };

  let tiles: HTMLDivElement | undefined;
  createScrollToSelection(() => tiles, getSelectedPath, isSelectedTileShown);

  return (
    <div
      ref={tiles}
      role="listbox"
      aria-label="State"
      class="grid min-h-full grid-cols-[repeat(auto-fill,minmax(92px,1fr))] content-start gap-1 p-2.5"
      onClick={(event) => {
        // The space between the tiles
        if (event.target === event.currentTarget) props.onSelect(getViewPath());
      }}
    >
      <Show when={getViewPath().length > 0}>
        <UpTile
          name={getUpName()}
          selectionState={pathEquals(getSelectedPath(), getParentPath()) ? 'selected' : 'normal'}
          onClick={goUp}
        />
      </Show>
      <For each={getKeys()}>
        {(key) => {
          const getPath = () => [...getViewPath(), key];
          return (
            <Tile
              path={getPath()}
              selectionState={pathEquals(getSelectedPath(), getPath()) ? 'selected' : 'normal'}
              onSelect={() => props.onSelect(getPath())}
              onOpen={() => open(getPath())}
            />
          );
        }}
      </For>
    </div>
  );
}
