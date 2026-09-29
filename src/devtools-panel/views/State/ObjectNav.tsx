import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { createMemo, createProjection, createSignal, For, Show, untrack } from 'solid-js';

import { deleteFromState, duplicateStateProperty, setState } from '@/devtools-panel/api/api';
import { getActiveState } from '@/devtools-panel/store/game-state';
import { getLockedPaths, isPathLockable, setPathLock } from '@/devtools-panel/store/locks';
import {
  addFilteredPath,
  createGetSetting,
  createGetViewState,
  createSetSetting,
  isPathFiltered,
  setViewState,
} from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { tooltip } from '@/devtools-panel/ui/display/TooltipDirective';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { showPromptDialog } from '@/devtools-panel/ui/util/Prompt';
import { createVirtualizer } from '@/devtools-panel/utils/create-virtualizer';
import { getContainerKeys, getJsonType, getKeyLabel, isContainerType } from '@/shared/json-safe';
import type {
  LockStatus,
  OrderConfig,
  Path,
  PropertyFilterKey,
  PropertyOrder,
  ValueType,
} from '@/shared/shared-types';

import { TypeIcon } from '../../ui/display/TypeIcon';
import { createContextMenuHandler } from '../../ui/util/ContextMenu';
import { AddPropertyDialog } from './dialogs/AddPropertyDialog';
import { DuplicateKeyDialog } from './dialogs/DuplicateKeyDialog';
import { FilterPropertiesDialog } from './dialogs/FilterPropertiesDialog';
import { SortPropertiesDialog } from './dialogs/SortPropertiesDialog';
import { isPathEditable } from './editable';
import { getLockStatus } from './lock-helper';
import { createSorter } from './property-sorter';

const getGlobalFilters = createGetSetting('state.filters');
const getGlobalPropertyOrder = createGetSetting('state.propertyOrder');
const getGlobalPropertyOrderDesc = createGetSetting('state.propertyOrderDesc');
const setGlobalFilters = createSetSetting('state.filters');
const setGlobalPropertyOrder = createSetSetting('state.propertyOrder');
const setGlobalPropertyOrderDesc = createSetSetting('state.propertyOrderDesc');

const getPath = createGetViewState('state', 'path');

const getNameForProperty = () =>
  showPromptDialog<string>('Name for property', (resolve) => (
    <DuplicateKeyDialog onConfirm={resolve} />
  ));

interface Entry {
  key: string | number;
  /** What is shown for the key; Set items are numbered from 0 while their key is the array index */
  label: string | number;
  type: ValueType;
}

const primitiveTypes: ValueType[] = ['string', 'number', 'boolean', 'null', 'undefined'];

interface Props {
  /** How many segments of the selected path lead to the container this column lists */
  depth: number;
}

export function ObjectNav(props: Props) {
  const isRoot = () => props.depth === 0;
  const [search, setSearch] = createSignal('');
  const [filters, setFilters] = createSignal<PropertyFilterKey[]>(
    untrack(() => (isRoot() ? getGlobalFilters() : [])),
  );
  const [getPropertyOrder, setPropertyOrder] = createSignal<PropertyOrder | null>(
    untrack(() => (isRoot() ? getGlobalPropertyOrder() : null)),
  );
  const [getPropertyOrderDesc, setPropertyOrderDesc] = createSignal<boolean | null>(
    untrack(() => (isRoot() ? getGlobalPropertyOrderDesc() : null)),
  );

  const parentPath = () => getPath().slice(0, props.depth);
  const name = () => getPath()[props.depth - 1];

  // Walks the path one segment at a time, so it only reacts to the properties along the path
  const container = createMemo(() => {
    const path = getPath();
    let value: unknown = getActiveState();
    for (let i = 0; i < props.depth; i++) {
      if (value === null || typeof value !== 'object') return undefined;
      value = (value as Record<string | number, unknown>)[path[i]!];
    }
    return value;
  });

  const containerType = createMemo(() => getJsonType(container()));
  const canEdit = () => isPathEditable([...parentPath(), '']);

  // A projection reconciles by key: the rows survive re-sorting and only the properties that
  // actually differ (a `type`, say) notify, so a changing value never rebuilds the list.
  const entries = createProjection<Entry[]>(
    () => {
      const object = container();
      const type = getJsonType(object);
      if (!isContainerType(type)) return [];

      const sorter = createSorter(
        object,
        getPropertyOrder() ?? getGlobalPropertyOrder(),
        getPropertyOrderDesc() ?? getGlobalPropertyOrderDesc(),
        parentPath(),
      );
      const activeFilters = filters();
      const query = search().toLowerCase();
      const children = object as Record<string | number, unknown>;

      return sorter(getContainerKeys(object, type))
        .map((key): Entry => ({
          key,
          label: getKeyLabel(type, key),
          type: getJsonType(children[key]),
        }))
        .filter(({ key, type }) => {
          if (activeFilters.includes(type as PropertyFilterKey)) return false;
          return !(activeFilters.includes('filtered') && isPathFiltered([...parentPath(), key]));
        })
        .filter(({ key, label, type }) => {
          if (!query) return true;
          if (`${label}`.toLowerCase().includes(query)) return true;
          return (
            primitiveTypes.includes(type) && String(children[key]).toLowerCase().includes(query)
          );
        });
    },
    [],
    { key: 'key' },
  );

  let scrollElRef: HTMLDivElement | undefined;
  // Only the rows in view are rendered; every row is the same height
  const virtualizer = createVirtualizer({
    getScrollElement: () => scrollElRef ?? null,
    estimateSize: () => 26,
    get count() {
      return entries.length;
    },
    overscan: 10,
  });

  const handlePropertyClick = (property: string | number) => {
    const prefix = parentPath();
    const newPath = [...prefix, property];
    const current = getPath();
    const isEqual = current.length === newPath.length && current.every((v, i) => v === newPath[i]);
    setViewState('state', 'path', isEqual ? prefix : newPath);
  };

  const onDuplicate = async (property: string | number) => {
    // For arrays, the duplicated value is added to the end of the array
    if (containerType() === 'array') return duplicateStateProperty(parentPath(), property);

    // For Objects/Maps, we need a name for the duplicated property
    const newPropertyKey = await getNameForProperty();
    if (newPropertyKey) return duplicateStateProperty(parentPath(), property, newPropertyKey);
  };

  const onAdd = async () => {
    const result = await showPromptDialog<{ name: string; value: unknown }>(
      'Add new',
      (resolve) => (
        <AddPropertyDialog
          path={parentPath()}
          onConfirm={(name, value) => resolve({ name, value })}
        />
      ),
    );

    if (result?.name) await setState([...parentPath(), result.name], result.value);
  };

  const onSort = async () => {
    const result = await showPromptDialog<OrderConfig>('Property order', (resolve) => (
      <SortPropertiesDialog
        orderBy={getPropertyOrder() ?? 'type'}
        descending={getPropertyOrderDesc() ?? getGlobalPropertyOrderDesc()}
        onConfirm={resolve}
      />
    )).catch(() => {});

    if (result) {
      setPropertyOrder(result.orderBy);
      setPropertyOrderDesc(result.descending);
      if (isRoot()) {
        setGlobalPropertyOrder(result.orderBy);
        setGlobalPropertyOrderDesc(result.descending);
      }
    }
  };

  const onFilter = async () => {
    const result = await showPromptDialog<PropertyFilterKey[]>('Visible properties', (resolve) => (
      <FilterPropertiesDialog filters={filters()} onConfirm={resolve} />
    )).catch(() => {});

    if (result) {
      setFilters(result);
      if (isRoot()) setGlobalFilters(result);
    }
  };

  return (
    <div class="flex h-full w-max max-w-3xs min-w-25 flex-col border-r border-r-gray-700 px-2">
      <Show when={!isRoot()}>
        <p class="w-full overflow-hidden text-lg text-ellipsis">{name()}</p>
      </Show>
      <div class="mb-3 flex justify-items-start gap-1">
        <Show when={isRoot()}>
          <input
            type="search"
            onInput={(e) => setSearch(e.target.value)}
            class={clsx(baseInputClasses, 'min-w-0 flex-1 rounded-md')}
            placeholder="Search"
          />
        </Show>
        <Show when={canEdit()}>
          <a ref={tooltip(() => 'Add new property')} onClick={onAdd} class={btnClass('icon')}>
            add
          </a>
        </Show>
        <a ref={tooltip(() => 'Sort')} onClick={onSort} class={btnClass('icon')}>
          sort
        </a>
        <a ref={tooltip(() => 'Filter by type')} onClick={onFilter} class={btnClass('icon')}>
          filter_alt
        </a>
      </div>
      <div class="flex-1 overflow-auto" ref={scrollElRef}>
        <ul class="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <For each={virtualizer.getVirtualItems()}>
            {(virtualItem) => {
              const entry = () => entries[virtualItem.index];
              return (
                <Show when={entry()}>
                  <NavItem
                    entry={entry()!}
                    depth={props.depth}
                    editable={canEdit()}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    onClick={() => handlePropertyClick(entry()!.key)}
                    onDuplicate={() => onDuplicate(entry()!.key)}
                  />
                </Show>
              );
            }}
          </For>
        </ul>
      </div>
    </div>
  );
}

interface NavItemProps {
  entry: Entry;
  depth: number;
  editable: boolean;
  style: JSX.CSSProperties;
  onClick: () => void;
  onDuplicate: () => void;
}

function NavItem(props: NavItemProps) {
  const path = (): Path => [...getPath().slice(0, props.depth), props.entry.key];
  const active = () => getPath()[props.depth] === props.entry.key;
  const lockStatus = (): LockStatus => getLockStatus(path, getLockedPaths);

  const toggleLock = () => setPathLock(path(), lockStatus() === 'unlocked');
  const cannotLock = () => lockStatus() === 'unlocked' && !isPathLockable(path());

  const onContextMenu = createContextMenuHandler([
    {
      disabled: () => !props.editable || lockStatus() === 'ancestor-lock' || cannotLock(),
      label: () => (
        <>
          <Show when={lockStatus() !== 'locked'}>
            Lock "<PrettyPath path={path()} class="font-mono" />"
            {cannotLock() && " (functions can't be locked)"}
          </Show>
          <Show when={lockStatus() === 'locked'}>
            Unlock "<PrettyPath path={path()} class="font-mono" />"
          </Show>
        </>
      ),
      onClick: toggleLock,
    },
    {
      label: () => (
        <>
          Filter "<PrettyPath path={path()} class="font-mono" />" from DiffLog
        </>
      ),
      onClick: () => addFilteredPath(path()),
      disabled: () => isPathFiltered(path()),
    },
    {
      label: () => (
        <>
          Duplicate "<PrettyPath path={path()} class="font-mono" />"
        </>
      ),
      onClick: () => props.onDuplicate(),
      disabled: () => !props.editable || lockStatus() === 'ancestor-lock',
    },
    {
      label: () => (
        <>
          Delete "<PrettyPath path={path()} class="font-mono" />"
        </>
      ),
      onClick: () => deleteFromState(path()),
      disabled: () => !props.editable || lockStatus() !== 'unlocked',
    },
  ]);

  return (
    <li style={props.style} onContextMenu={onContextMenu}>
      <a
        onClick={() => props.onClick()}
        class={clsx(
          'flex cursor-pointer items-center gap-1 rounded-md p-1',
          active()
            ? 'outline-2 -outline-offset-2 outline-gray-300'
            : 'outline-transparent hover:bg-gray-700',
        )}
      >
        <TypeIcon type={props.entry.type} />
        <span class="flex-1 overflow-hidden text-ellipsis">
          {props.entry.label}
          {lockStatus() === 'locked' && '🔒'}
          {lockStatus() === 'ancestor-lock' && <span class="saturate-0">🔒</span>}
        </span>
      </a>
    </li>
  );
}
