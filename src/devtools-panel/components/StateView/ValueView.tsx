import { createMemo, JSX, Match, Show, Switch } from 'solid-js';

import {
  addLockPath,
  createGetViewState,
  getActiveState,
  removeLockPath,
} from '@/devtools-panel/store/store';
import { getLockStatus } from '@/devtools-panel/utils/is-locked';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import { ArrayValue, MapValue, ObjectValue, Path, Value, ValueType } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { PrettyPath } from './PrettyPath';
import { TypeIcon } from './TypeIcon';
import { ArrayInput, MapInput, ObjectInput } from './ValueView/ContainerInputs';
import { BooleanInput, NumberInput, StringInput } from './ValueView/PrimitiveInputs';

const nonEditable: ValueType[] = ['function', 'null', 'undefined'];

export function ValueView() {
  const getPath = createGetViewState('state', 'path');
  const getValue = createMemo(() => getObjectPathValue(getActiveState()!, getPath()));
  const type = () => getSpecificType(getValue());
  const getLockedPaths = createGetViewState('state', 'lockedPaths');

  const value = () => {
    const valueType = type();
    if (valueType === 'null') return null;
    if (valueType === 'undefined') return undefined;
    if (valueType === 'function') return 'function';
    return getValue();
  };

  const toggleLock = (path: Path) => {
    if (getLockStatus(() => path, getLockedPaths) === 'locked') removeLockPath(path);
    if (getLockStatus(() => path, getLockedPaths) === 'unlocked') addLockPath(path);
  };

  const readOnly = () => getLockStatus(() => getPath(), getLockedPaths) !== 'unlocked';

  return (
    <div class="flex gap-2 flex-col py-1 px-2 overflow-auto flex-1">
      <p>
        <span class="font-bold text-sm">
          <PrettyPath path={getPath()} statePrefix />
        </span>
        <Show when={!readOnly()}>
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
          <StringInput
            // TODO: Dont pass these, just pass props
            // TODO: create separate StringInput & StateInput

            value={value() as string}
            editable={readOnly()}
            onChange={props.onChange}
            lockStatus={getLockStatus(() => getPath(), getLockedPaths)}
            toggleLock={() => toggleLock(props.path)}
          />
        </Match>
        <Match when={type() === 'number'}>
          <NumberInput
            value={value() as number}
            editable={props.editable}
            onChange={props.onChange}
            lockStatus={getLockStatus(() => props.path, props.getLockedPaths)}
            toggleLock={() => toggleLock(props.path)}
          />
        </Match>
        <Match when={type() === 'boolean'}>
          <BooleanInput
            value={value() as boolean}
            editable={props.editable}
            onChange={props.onChange}
            lockStatus={getLockStatus(() => props.path, props.getLockedPaths)}
            toggleLock={() => toggleLock(props.path)}
          />
        </Match>
        <Match when={type() === 'object'}>
          <ObjectInput
            path={props.path}
            addLockPath={props.addLockPath}
            removeLockPath={props.removeLockPath}
            getLockedPaths={props.getLockedPaths}
            value={value() as ObjectValue}
            editable={props.editable}
            onChange={props.onPropertyChange}
          />
        </Match>
        <Match when={type() === 'map'}>
          <MapInput
            path={props.path}
            addLockPath={props.addLockPath}
            removeLockPath={props.removeLockPath}
            getLockedPaths={props.getLockedPaths}
            value={value() as MapValue}
            editable={props.editable}
            onChange={props.onPropertyChange}
          />
        </Match>
        <Match when={type() === 'array'}>
          <ArrayInput
            path={props.path}
            addLockPath={props.addLockPath}
            removeLockPath={props.removeLockPath}
            getLockedPaths={props.getLockedPaths}
            value={value() as ArrayValue}
            editable={props.editable}
            onChange={props.onPropertyChange}
          />
        </Match>
      </Switch>
    </div>
  );
}
