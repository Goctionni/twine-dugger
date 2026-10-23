import type { Component } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getStatePath } from '@/devtools-panel/store/state-location';
import type { Path, ValueType } from '@/shared/shared-types';

import { TYPE_ORDER } from '../logic/sort-keys';
import type { NavProps, Navigator } from '../types';
import { getTypesInColumns } from './MillerNav/logic/types-in-columns';
import { MillerNav } from './MillerNav/MillerNav';
import { TilesNav } from './TilesNav';
import { getTreeTypes } from './TreeNav/tree-types';
import { TreeNav } from './TreeNav/TreeNav';

interface NavigatorEntry {
  Component: Component<NavProps>;
  /** The path that the breadcrumbs show */
  getBreadcrumbsPath: () => Path;
  /** The types of what the navigator shows, for the filter of types in the toolbar */
  getAvailableTypes: () => ValueType[];
}

/** What the rest of the State view needs to know of each navigator */
export const navigators: Record<Navigator, NavigatorEntry> = {
  miller: {
    Component: MillerNav,
    getBreadcrumbsPath: getStatePath,
    getAvailableTypes: () => getTypesInColumns(getLatestState(), getStatePath()),
  },
  tree: {
    Component: TreeNav,
    getBreadcrumbsPath: getStatePath,
    getAvailableTypes: getTreeTypes,
  },
  tiles: {
    Component: TilesNav,
    getBreadcrumbsPath: getStatePath,
    // TODO: the tiles show one container (Backlog 28)
    getAvailableTypes: () => TYPE_ORDER,
  },
};
