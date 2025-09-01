import { createMemo, Match, Show, Switch } from 'solid-js';

import { createGetViewState, getActiveState } from '@/devtools-panel/store';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import { ArrayValue, MapValue, ObjectValue, ValueType } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { PrettyPath } from '../../ui/display/PrettyPath';
import { TypeIcon } from '../../ui/display/TypeIcon';
import { StateArrayInput } from './StateInputs/StateArrayInput';
import { StateBooleanInput } from './StateInputs/StateBooleanInput';
import { StateMapInput } from './StateInputs/StateMapInput';
import { StateNumberInput } from './StateInputs/StateNumberInput';
import { StateObjectInput } from './StateInputs/StateObjectInput';
import { StateStringInput } from './StateInputs/StateStringInput';

const nonEditable: ValueType[] = ['function', 'null', 'undefined'];

export function ValueView() {
  const getPath = createGetViewState('state', 'path');
  const getHistoryId = createGetViewState('state', 'historyId');
  const getValue = createMemo(() => getObjectPathValue(getActiveState()!, getPath()));
  const type = () => getSpecificType(getValue());

  const value = () => {
    const valueType = type();
    if (valueType === 'null') return null;
    if (valueType === 'undefined') return undefined;
    if (valueType === 'function') return 'function';
    return getValue();
  };

  const isReadOnly = () => getHistoryId() !== -1;

  return (
    <div class="flex gap-2 flex-col py-1 px-2 overflow-auto flex-1">
      <p>
        <span class="font-bold text-sm">
          <PrettyPath path={getPath()} statePrefix />
        </span>
        <Show when={isReadOnly()}>
          <span class="ml-2 text-red-400">(readonly)</span>
        </Show>
      </p>
      <p class="flex items-center gap-1">
        <TypeIcon type={type()} />
        <span class="font-mono">{type()}</span>
      </p>
      <Switch fallback={<p>Input for this type is not implemented yet</p>}>
        <Match when={nonEditable.includes(type())}>
          <p>Values of this type cannot be edited</p>
        </Match>
        <Match when={type() === 'string'}>
          <StateStringInput path={getPath()} />
        </Match>
        <Match when={type() === 'number'}>
          <StateNumberInput path={getPath()} />
        </Match>
        <Match when={type() === 'boolean'}>
          <StateBooleanInput path={getPath()} />
        </Match>
        <Match when={type() === 'object'}>
          <StateObjectInput path={getPath()} value={value() as ObjectValue} />
        </Match>
        <Match when={type() === 'map'}>
          <StateMapInput path={getPath()} value={value() as MapValue} />
        </Match>
        <Match when={type() === 'array'}>
          <StateArrayInput path={getPath()} value={value() as ArrayValue} />
        </Match>
      </Switch>
    </div>
  );
}
