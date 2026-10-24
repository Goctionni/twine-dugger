import { For, createMemo, createSignal } from 'solid-js';

import { getLastChangeId, getLatestState } from '@/devtools-panel/store/game-state';
import { requestScrollTo } from '@/devtools-panel/store/state-location';
import { isPinned } from '@/devtools-panel/store/store';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getContainerKeyLabel, getPathValue, isContainer, isSet } from '@/shared/json-safe';
import { pathStartsWith } from '@/shared/path-equals';
import type { Path } from '@/shared/shared-types';

import { getHiddenTypes, getSort } from '../../store-helpers/view-prefs';
import type { NavProps } from '../../types';
import { provideNavigatorInfo } from '../navigator-info';
import { createScrollToSelection } from '../Shared/create-scroll-to-selection';
import { getTypesIn } from '../Shared/get-types-in';
import { isTypeAheadKey, provideTypeAhead } from '../Shared/TypeAhead/provide-type-ahead';
import { getVisibleKeys } from '../Shared/visible-keys';
import { Tile } from './Tile';
import { resolveTilesContainerPath } from './tiles-container-path';
import {
  handleGoUpKey,
  handleLeftRightKey,
  handleSelectKey,
  handleUpDownKey,
  isGoUpKey,
  isLeftRightKey,
  isSelectKey,
  isUpDownKey,
  type TilesKeyContext,
} from './tiles-keyboard-helper';
import { UpTile } from './UpTile';

// The tile that goes up has no key in the container that is shown: this stands for it
const UP = Symbol('up');
type TileKey = string | number | typeof UP;

export function TilesNav(props: NavProps) {
  const tilesId = `tiles-${crypto.randomUUID()}`;
  const getTileId = (key: TileKey) =>
    `${tilesId}-${key === UP ? 'up' : `key-${encodeURIComponent(key)}`}`;

  // What is selected in the State view
  const getGlobalPath = createStablePath(() => props.path);
  // The container that the tiles show. It follows the global path when that goes somewhere else, and
  // keeps its own value while the global path is in it
  const [getTilesContainerPath, setTilesContainerPath] = createSignal(
    (tilesContainerPath: Path | undefined) =>
      resolveTilesContainerPath(getLatestState(), getGlobalPath(), tilesContainerPath),
  );
  const getParentPath = () => getTilesContainerPath().slice(0, -1);
  const hasUpTile = () => getTilesContainerPath().length > 0;
  const getTilePath = (key: TileKey) =>
    key === UP ? getParentPath() : [...getTilesContainerPath(), key];

  // The tiles in the order that they are shown
  const getTileKeys = createMemo<TileKey[]>(
    () => {
      const keys = getVisibleKeys(
        getPathValue(getLatestState(), getTilesContainerPath()),
        getSort(),
        getHiddenTypes(),
        (key) => getLastChangeId([...getTilesContainerPath(), key]),
        (key) => isPinned([...getTilesContainerPath(), key]),
      );
      return hasUpTile() ? [UP, ...keys] : keys;
    },
    { equals: sameItems },
  );

  // The tile of the global path, if it has one. The tiles container path is the global path, a
  // start of it (the global path is one of the tiles) or one longer (the tile that goes up)
  const getSelectedKey = createMemo<TileKey | undefined>(() => {
    const tilesContainerPath = getTilesContainerPath();
    if (getGlobalPath().length < tilesContainerPath.length) return UP;
    return getGlobalPath()[tilesContainerPath.length];
  });
  const getSelectedIndex = () => {
    const key = getSelectedKey();
    return key === undefined ? -1 : getTileKeys().indexOf(key);
  };
  const getActiveId = () => (getSelectedIndex() < 0 ? undefined : getTileId(getSelectedKey()!));

  const selectAndScrollTo = (path: Path) => {
    props.onSelect(path);
    requestScrollTo();
  };
  const open = (path: Path) => {
    setTilesContainerPath(path);
    props.onSelect(path);
    // It starts at the top, and nothing in it is selected
    tiles?.scrollIntoView({ block: 'start' });
  };
  // The container that it came from is selected
  const goUpTo = (path: Path) => {
    const cameFrom = getTilesContainerPath().slice(0, path.length + 1);
    setTilesContainerPath(path);
    selectAndScrollTo(cameFrom);
  };
  const goUp = () => goUpTo(getParentPath());

  provideNavigatorInfo({
    getBreadcrumbsPath: getTilesContainerPath,
    getAvailableTypes: () => getTypesIn(getPathValue(getLatestState(), getTilesContainerPath())),
    // A container above the tiles is a way up; anything else is selected
    onBreadcrumbClick: (path) => {
      const tilesContainerPath = getTilesContainerPath();
      const isAbove =
        path.length < tilesContainerPath.length && pathStartsWith(tilesContainerPath, path);
      if (isAbove) goUpTo(path);
      else selectAndScrollTo(path);
    },
  });

  let tiles: HTMLDivElement | undefined;
  // A tile is there as soon as the selection is: there is nothing to wait for
  createScrollToSelection(
    () => tiles,
    getGlobalPath,
    () => true,
  );

  const selectTile = (index: number) => {
    const key = getTileKeys()[index]!;
    const path = getTilePath(key);
    selectAndScrollTo(path);
  };

  const handleTypeAheadKey = provideTypeAhead({
    getNames: () => {
      const tilesContainer = getPathValue(getLatestState(), getTilesContainerPath());
      if (!isContainer(tilesContainer)) return [];
      const isSetContainer = isSet(tilesContainer);
      return getTileKeys().map((key) => {
        if (key === UP) return '';
        return isSetContainer ? getContainerKeyLabel(tilesContainer, key) : String(key);
      });
    },
    getSelectedIndex,
    selectIndex: selectTile,
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const activateTile = (index: number) => {
      const key = getTileKeys()[index]!;
      if (key === UP) goUp();
      else if (isContainer(getPathValue(getLatestState(), getTilePath(key)))) {
        open(getTilePath(key));
      }
    };
    const context: TilesKeyContext = {
      selectedIndex: getSelectedIndex(),
      tileCount: getTileKeys().length,
      hasUpTile: hasUpTile(),
      // One width for each column, as the browser worked them out
      getColumns: () => getComputedStyle(tiles!).gridTemplateColumns.split(' ').length,
      selectTile,
      activateTile,
      goUp,
    };

    if (isGoUpKey(event)) return handleGoUpKey(event, context);
    if (isSelectKey(event)) return handleSelectKey(event, context);
    if (isLeftRightKey(event)) return handleLeftRightKey(event, context);
    if (isUpDownKey(event)) return handleUpDownKey(event, context);
    if (isTypeAheadKey(event)) return handleTypeAheadKey(event);
  };

  return (
    <div
      ref={tiles}
      role="listbox"
      aria-label="State"
      tabindex="0"
      aria-activedescendant={getActiveId()}
      onKeyDown={onKeyDown}
      class="grid min-h-full grid-cols-[repeat(auto-fill,minmax(92px,1fr))] content-start gap-1 p-2.5 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500"
      onClick={(event) => {
        // The space between the tiles
        if (event.target === event.currentTarget) props.onSelect(getTilesContainerPath());
      }}
    >
      <For each={getTileKeys()}>
        {(key) =>
          key === UP ? (
            <UpTile
              id={getTileId(key)}
              path={getParentPath()}
              selectionState={getSelectedKey() === key ? 'selected' : 'normal'}
              onClick={goUp}
            />
          ) : (
            <Tile
              id={getTileId(key)}
              path={getTilePath(key)}
              selectionState={getSelectedKey() === key ? 'selected' : 'normal'}
              onSelect={() => props.onSelect(getTilePath(key))}
              onOpen={() => open(getTilePath(key))}
            />
          )
        }
      </For>
    </div>
  );
}
