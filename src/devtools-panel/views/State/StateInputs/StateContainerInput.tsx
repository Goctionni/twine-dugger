import { createMemo, For, Match, Show, Switch, untrack } from 'solid-js';

import { createGetSetting } from '@/devtools-panel/store/store';
import type { ContainerType } from '@/shared/json-safe';
import { getContainerKeys, getJsonType, getKeyLabel, isContainerType } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { TypeIcon } from '../../../ui/display/TypeIcon';
import { createVirtualizer } from '../../../utils/create-virtualizer';
import { sameItems } from '../../../utils/same-items';
import { RenderValue } from '../../DiffLog/RenderValue';
import { createSorter } from '../property-sorter';
import { StateBooleanInput } from './StateBooleanInput';
import { StateNumberInput } from './StateNumberInput';
import { StateStringInput } from './StateStringInput';

const getPropertyOrder = createGetSetting('state.propertyOrder');

const ROW_HEIGHT = 36;

interface StateContainerInputProps {
  path: Path;
  getValue: () => unknown;
  getType: () => ContainerType;
  getScrollElement: () => HTMLElement | undefined;
}

export function StateContainerInput(props: StateContainerInputProps) {
  // Only the keys of the primitive children are listed, as the others are navigated to. The types
  // are read untracked: a child that turns into a container later keeps its (empty) row until the
  // keys change, which is cheaper than tracking every child of a container that has thousands.
  const keys = createMemo(
    () => {
      const value = props.getValue();
      const type = props.getType();
      const keys = getContainerKeys(value, type);
      const sorted = createSorter(value, getPropertyOrder(), false, props.path)(keys);

      const children = value as Record<string | number, unknown>;
      return untrack(() => sorted.filter((key) => !isContainerType(getJsonType(children[key]))));
    },
    { equals: sameItems },
  );

  const virtualizer = createVirtualizer({
    getScrollElement: () => props.getScrollElement() ?? null,
    estimateSize: () => ROW_HEIGHT,
    get count() {
      return keys().length;
    },
    overscan: 10,
  });

  return (
    <div class="relative px-3 py-2" style={{ height: `${virtualizer.getTotalSize()}px` }}>
      <For each={virtualizer.getVirtualItems()}>
        {(virtualItem) => {
          const key = () => keys()[virtualItem.index];
          return (
            <Show when={key() !== undefined}>
              <Row
                path={props.path}
                key={key()!}
                getValue={props.getValue}
                getType={props.getType}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              />
            </Show>
          );
        }}
      </For>
    </div>
  );
}

interface RowProps {
  path: Path;
  key: string | number;
  getValue: () => unknown;
  getType: () => ContainerType;
  style: Record<string, string | number>;
}

function Row(props: RowProps) {
  const value = () => (props.getValue() as Record<string | number, unknown>)[props.key];
  const type = createMemo(() => getJsonType(value()));
  const childPath = () => [...props.path, props.key];
  const label = () => getKeyLabel(props.getType(), props.key);

  return (
    <Show when={!isContainerType(type())}>
      <div class="grid grid-cols-[20px_10rem_1fr] items-center gap-2 px-3" style={props.style}>
        <TypeIcon type={type()} />
        <span class="truncate" title={String(label())}>
          {label()}
        </span>
        <div>
          <Switch
            fallback={
              <Show
                when={type() === 'null' || type() === 'undefined'}
                fallback={<span class="font-mono">{type()}</span>}
              >
                <RenderValue value={value() as JSONSafeValue} />
              </Show>
            }
          >
            <Match when={type() === 'string'}>
              <StateStringInput path={childPath()} />
            </Match>
            <Match when={type() === 'number'}>
              <StateNumberInput path={childPath()} />
            </Match>
            <Match when={type() === 'boolean'}>
              <StateBooleanInput path={childPath()} />
            </Match>
          </Switch>
        </div>
      </div>
    </Show>
  );
}
