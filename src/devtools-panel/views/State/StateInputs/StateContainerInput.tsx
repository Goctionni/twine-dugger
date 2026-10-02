import { createMemo, For, Match, Show, Switch } from 'solid-js';

import { createGetSetting } from '@/devtools-panel/store/store';
import type { ContainerType } from '@/shared/json-safe';
import { getContainerKeys, getJsonType, getKeyLabel, isContainerType } from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { TypeIcon } from '../../../ui/display/TypeIcon';
import { sameItems } from '../../../utils/same-items';
import { RenderValue } from '../../DiffLog/RenderValue';
import { createSorter } from '../property-sorter';
import { StateBooleanInput } from './StateBooleanInput';
import { StateNumberInput } from './StateNumberInput';
import { StateStringInput } from './StateStringInput';

const getPropertyOrder = createGetSetting('state.propertyOrder');

interface StateContainerInputProps {
  path: Path;
  getValue: () => unknown;
  getType: () => ContainerType;
}

export function StateContainerInput(props: StateContainerInputProps) {
  // Only the set of keys (and the order) is tracked here; each row reads its own value
  const keys = createMemo(
    () => {
      const value = props.getValue();
      const type = props.getType();
      const keys = getContainerKeys(value, type);
      if (type !== 'object' && type !== 'map') return keys;
      return createSorter(value, getPropertyOrder(), false, props.path)(keys);
    },
    { equals: sameItems },
  );

  return (
    <div class="grid auto-rows-fr grid-cols-[20px_auto_1fr] items-center gap-2 px-3 py-2">
      <For each={keys()}>
        {(key) => {
          const value = () => (props.getValue() as Record<string | number, unknown>)[key];
          const type = createMemo(() => getJsonType(value()));
          const childPath = () => [...props.path, key];
          const label = () => getKeyLabel(props.getType(), key);

          return (
            <Show when={!isContainerType(type())}>
              <TypeIcon type={type()} />
              <span>{label()}</span>
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
            </Show>
          );
        }}
      </For>
    </div>
  );
}
