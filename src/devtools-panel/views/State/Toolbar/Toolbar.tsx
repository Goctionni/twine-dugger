import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { sameItems } from '@/devtools-panel/utils/same-items';
import type { Path, ValueType } from '@/shared/shared-types';

import { TYPE_ORDER } from '../logic/sort-keys';
import { getTypesInColumns } from '../logic/types-in-columns';
import type { Navigator, Sort } from '../types';
import { createResolveBreakpoints } from './createResolveBreakpoints';
import { NavigatorSwitch } from './NavigatorSwitch';
import { SearchInput } from './SearchInput';
import { SortMenu } from './SortMenu';
import { TypeFilter } from './TypeFilter';

interface Props {
  navigator: Navigator;
  onNavigatorChange: (navigator: Navigator) => void;
  path: Path;
  searchText: string;
  onSearchTextChange: (searchText: string) => void;
  hiddenTypes: ValueType[];
  onHiddenTypesChange: (hiddenTypes: ValueType[]) => void;
  sort: Sort;
  onSortChange: (sort: Sort) => void;
}

export function Toolbar(props: Props) {
  let toolbarRef: HTMLDivElement | undefined;
  const breakpoints = createResolveBreakpoints(
    {
      navSwitch: { minimal: 0, labels: 520 },
      typeFilter: { minimal: 0, labels: 520, full: 760 },
      sort: { minimal: 0, labels: 520 },
    },
    () => toolbarRef,
  );

  // A hidden type stays in the list, so that it can be shown again
  const getTypes = createMemo(
    () => {
      // TODO: the tree and the tiles show other parts of the state than the columns do (Backlog 28)
      const onScreen =
        props.navigator === 'miller' ? getTypesInColumns(getLatestState(), props.path) : TYPE_ORDER;
      return TYPE_ORDER.filter(
        (type) => onScreen.includes(type) || props.hiddenTypes.includes(type),
      );
    },
    { equals: sameItems },
  );

  return (
    <div ref={toolbarRef} class="flex items-center gap-2 border-b border-gray-700 p-2">
      <NavigatorSwitch
        variant={breakpoints.navSwitch()}
        navigator={props.navigator}
        onChange={props.onNavigatorChange}
      />
      <SearchInput value={props.searchText} onChange={props.onSearchTextChange} />
      <TypeFilter
        variant={breakpoints.typeFilter()}
        types={getTypes()}
        hiddenTypes={props.hiddenTypes}
        onChange={props.onHiddenTypesChange}
      />
      <SortMenu variant={breakpoints.sort()} sort={props.sort} onChange={props.onSortChange} />
    </div>
  );
}
