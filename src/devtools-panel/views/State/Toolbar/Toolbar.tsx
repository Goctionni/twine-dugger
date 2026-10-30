import { createMemo } from 'solid-js';

import { sameItems } from '@/devtools-panel/utils/same-items';
import type { ValueType } from '@/shared/shared-types';

import { TYPE_ORDER } from '../logic/sort-keys';
import type { Navigator, Sort } from '../types';
import { createResolveBreakpoints } from './createResolveBreakpoints';
import { NavigatorSwitch } from './NavigatorSwitch';
import { SearchInput } from './SearchInput';
import { SortMenu } from './SortMenu';
import { TypeFilter } from './TypeFilter';

interface Props {
  navigator: Navigator;
  onNavigatorChange: (navigator: Navigator) => void;
  searchText: string;
  onSearchTextChange: (searchText: string) => void;
  /** The types of what the navigator shows */
  availableTypes: ValueType[];
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
      return TYPE_ORDER.filter(
        (type) => props.availableTypes.includes(type) || props.hiddenTypes.includes(type),
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
