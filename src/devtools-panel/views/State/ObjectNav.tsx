import clsx from 'clsx';
import { createMemo, createSignal, For, Show, untrack } from 'solid-js';

import {
  addFilteredPath,
  addLockPath,
  createGetSetting,
  createGetViewState,
  createSetSetting,
  getActiveState,
  getLockedPaths,
  isPathFiltered,
  removeLockPath,
  setViewState,
} from '@/devtools-panel/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { tooltip } from '@/devtools-panel/ui/display/TooltipDirective';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { showPromptDialog } from '@/devtools-panel/ui/util/Prompt';
import { getLockStatus } from '@/devtools-panel/views/State/lock-helper';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import type { OrderConfig, PropertyFilterKey, PropertyOrder } from '@/shared/shared-types';
import {
  type ContainerValue,
  type LockStatus,
  type Path,
  type Value,
  type ValueType,
} from '@/shared/shared-types';
import { getSpecificType, isValuePrimitive } from '@/shared/type-helpers';

import {
  deleteFromState,
  duplicateStateProperty,
  setState,
  setStatePropertyLock,
} from '../../api/api';
import { TypeIcon } from '../../ui/display/TypeIcon';
import { createContextMenuHandler } from '../../ui/util/ContextMenu';
import { AddPropertyDialog } from './dialogs/AddPropertyDialog';
import { DuplicateKeyDialog } from './dialogs/DuplicateKeyDialog';
import { FilterPropertiesDialog } from './dialogs/FilterPropertiesDialog';
import { SortPropertiesDialog } from './dialogs/SortPropertiesDialog';
import { createSorter } from './property-sorter';

const getGlobalFilters = createGetSetting('state.filters');
const getGlobalPropertyOrder = createGetSetting('state.propertyOrder');
const getGlobalPropertyOrderDesc = createGetSetting('state.propertyOrderDesc');
const setGlobalFilters = createSetSetting('state.filters');
const setGlobalPropertyOrder = createSetSetting('state.propertyOrder');
const setGlobalPropertyOrderDesc = createSetSetting('state.propertyOrderDesc');

const getNameForProperty = () =>
  showPromptDialog<string>('Name for property', (resolve) => (
    <DuplicateKeyDialog onConfirm={resolve} />
  ));

interface Props {
  path: Path;
  selectedProperty?: string | number;
}

export function ObjectNav(props: Props) {
  const isRoot = () => props.path.length === 0;
  const [search, setSearch] = createSignal('');
  const [filters, setFilers] = createSignal<PropertyFilterKey[]>(
    untrack(() => (isRoot() ? getGlobalFilters() : [])),
  );
  const getName = () => props.path.at(-1);
  const getObject = createMemo(
    () => getObjectPathValue(getActiveState()!, props.path) as ContainerValue,
  );

  const [getPropertyOrder, setPropertyOrder] = createSignal<PropertyOrder | null>(
    untrack(() => (isRoot() ? getGlobalPropertyOrder() : null)),
  );
  const [getPropertyOrderDesc, setPropertyOrderDesc] = createSignal<boolean | null>(
    untrack(() => (isRoot() ? getGlobalPropertyOrderDesc() : null)),
  );

  const getChildren = createMemo(() => {
    const object = getObject();
    if (!object) return [];

    const propertyOrder = getPropertyOrder() ?? getGlobalPropertyOrder();
    const desc = getPropertyOrderDesc() ?? getGlobalPropertyOrderDesc();
    const sorter = createSorter(object, propertyOrder, desc, props.path);
    const activeFilters = filters();

    const rawKeys =
      object instanceof Map
        ? sorter(Array.from(object.keys()))
        : object instanceof Array
          ? Array.from(Array(object.length).keys())
          : sorter(Object.keys(object));

    // Convert to child key format
    return rawKeys
      .map((key): ContainerChild & { value: Value } => {
        const value = getObjectPathValue(object, [key]);
        const type = getSpecificType(value);
        return { text: key, value, type };
      })
      .filter(({ text, type }) => {
        if (activeFilters.includes(type)) return false;
        if (activeFilters.includes('filtered') && isPathFiltered([...props.path, text])) {
          return false;
        }
        return true;
      })
      .filter(({ text, value }) => {
        const query = search();
        if (!query) return true;
        if (`${text}`.toLowerCase().includes(query.toLowerCase())) return true;
        return isValuePrimitive(value) && `${value}`.toLowerCase().includes(query.toLowerCase());
      });
  });

  const onDuplicate = async (property: string | number) => {
    const object = getObject();
    // For arrays, the duplicated value is added to the end of the array
    if (Array.isArray(object)) return duplicateStateProperty(props.path, property);

    // For Objects/Maps, we need a name for the duplicated property
    const newPropertyKey = await getNameForProperty();
    if (newPropertyKey) return duplicateStateProperty(props.path, property, newPropertyKey);
  };

  const onAdd = async () => {
    const result = await showPromptDialog<{ name: string; value: unknown }>(
      'Add new',
      (resolve) => (
        <AddPropertyDialog
          path={props.path}
          onConfirm={(name, value) => resolve({ name, value })}
        />
      ),
    );

    if (result && result.name) {
      const fullPath = [...props.path, result.name];
      await setState(fullPath, result.value);
    }
  };

  const handlePropertyClick = (property: string | number) => {
    const currentPath = createGetViewState('state', 'path')();
    const newPath = [...props.path, property];
    const isEqual =
      currentPath.length === newPath.length &&
      currentPath.every((val, idx) => val === newPath[idx]);
    setViewState('state', 'path', [...(isEqual ? props.path : newPath)]);
  };

  const handleDelete = async (path: Path) => {
    await deleteFromState(path);
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
      if (!props.path.length) {
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
      setFilers(result);
      if (isRoot()) setGlobalFilters(result);
    }
  };

  return (
    <div class="flex h-full w-max max-w-3xs min-w-25 flex-col border-r border-r-gray-700 px-2">
      <Show when={props.path.length > 0}>
        <p class="w-full overflow-hidden text-lg text-ellipsis">{getName()}</p>
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
        <a use:tooltip="Add new property" onClick={onAdd} class={btnClass('icon')}>
          add
        </a>
        <a use:tooltip="Sort" onClick={onSort} class={btnClass('icon')}>
          sort
        </a>
        <a use:tooltip="Filter by type" onClick={onFilter} class={btnClass('icon')}>
          filter_alt
        </a>
      </div>
      <ul class="flex flex-1 flex-col overflow-auto">
        <For each={getChildren()}>
          {(child) => {
            const childPath = () => [...props.path, child.text];
            const lockStatus = () => getLockStatus(childPath, getLockedPaths);
            return (
              <NavItem
                child={child}
                lockStatus={lockStatus()}
                setLockState={(lock) => {
                  setStatePropertyLock(childPath(), lock);
                  if (lock) addLockPath(childPath());
                  else removeLockPath(childPath());
                }}
                active={child.text === props.selectedProperty}
                onClick={() => handlePropertyClick(child.text)}
                onDelete={() => handleDelete(childPath())}
                onDuplicate={() => onDuplicate(child.text)}
                path={childPath()}
              />
            );
          }}
        </For>
      </ul>
    </div>
  );
}

interface ContainerChild {
  text: string | number;
  type: ValueType;
}

interface NavItemProps {
  path: Path;
  child: ContainerChild;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  lockStatus: LockStatus;
  setLockState: (lock: boolean) => void;
}

function NavItem(props: NavItemProps) {
  const onContextMenu = createContextMenuHandler([
    {
      disabled: () => props.lockStatus === 'ancestor-lock',
      label: () => (
        <>
          <Show when={props.lockStatus !== 'locked'}>
            Lock "<PrettyPath path={props.path} class="font-mono" />"
          </Show>
          <Show when={props.lockStatus === 'locked'}>
            Unlock "<PrettyPath path={props.path} class="font-mono" />"
          </Show>
        </>
      ),
      onClick: () => props.setLockState(props.lockStatus === 'unlocked'),
    },
    {
      label: () => (
        <>
          Filter "<PrettyPath path={props.path} class="font-mono" />" from DiffLog
        </>
      ),
      onClick: () => addFilteredPath(props.path),
      disabled: () => isPathFiltered(props.path),
    },
    {
      label: () => (
        <>
          Duplicate "<PrettyPath path={props.path} class="font-mono" />"
        </>
      ),
      onClick: () => props.onDuplicate(),
      disabled: () => props.lockStatus === 'ancestor-lock',
    },
    {
      label: () => (
        <>
          Delete "<PrettyPath path={props.path} class="font-mono" />"
        </>
      ),
      onClick: () => props.onDelete(),
      disabled: () => props.lockStatus !== 'unlocked',
    },
  ]);

  return (
    <li onContextMenu={onContextMenu}>
      <a
        onClick={() => props.onClick()}
        class={clsx(
          'flex cursor-pointer items-center gap-1 rounded-md p-1',
          props.active
            ? 'outline-2 -outline-offset-2 outline-gray-300'
            : 'outline-transparent hover:bg-gray-700',
        )}
      >
        <TypeIcon type={props.child.type} />
        <span class="flex-1 overflow-hidden text-ellipsis">
          {props.child.text}
          {props.lockStatus === 'locked' && '🔒'}
          {props.lockStatus === 'ancestor-lock' && <span class="saturate-0">🔒</span>}
        </span>
      </a>
    </li>
  );
}
