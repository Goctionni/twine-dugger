import type { ValueType } from '@/shared/shared-types';

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
  types: ValueType[];
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
        types={props.types}
        hiddenTypes={props.hiddenTypes}
        onChange={props.onHiddenTypesChange}
      />
      <SortMenu variant={breakpoints.sort()} sort={props.sort} onChange={props.onSortChange} />
    </div>
  );
}
