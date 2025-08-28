import { Index, Match, Show, Switch } from 'solid-js';

import { Path, Value } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { TypeIcon } from '../TypeIcon';
import { StateBooleanInput } from './StateBooleanInput';
import { StateNumberInput } from './StateNumberInput';
import { StateStringInput } from './StateStringInput';

interface StateContainerInputProps<TKey extends string | number> {
  path: Path;
  keys: TKey[];
  getKeyValue: (key: TKey) => Value;
}

export function StateContainerInput<TKey extends string | number>(
  props: StateContainerInputProps<TKey>,
) {
  return (
    <div class="grid grid-cols-[20px_auto_1fr] auto-rows-fr items-center gap-2 py-2 px-3">
      <Index each={props.keys}>
        {(key) => {
          const value = () => props.getKeyValue(key());
          const type = () => getSpecificType(value());
          const childPath = () => [...props.path, key()];

          return (
            <Show when={['string', 'number', 'boolean'].includes(type())}>
              <TypeIcon type={type()} />
              <span class="">{key()}</span>
              <div>
                <Switch fallback={<div class="font-mono">{type()}</div>}>
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
      </Index>
    </div>
  );
}
