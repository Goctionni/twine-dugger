import { ArrayValue, MapValue, ObjectValue, Path, Value, ValueType } from '@/shared/shared-types';
import { JSX, Match, Show, Switch } from 'solid-js';
import { TypeIcon } from './TypeIcon';
import { BooleanInput, NumberInput, StringInput } from './ValueView/PrimitiveInputs';
import { ArrayInput, MapInput, ObjectInput } from './ValueView/ContainerInputs';
import { getSpecificType } from '@/shared/type-helpers';
import { getLockStatus } from '@/devtools-panel/utils/is-locked';

interface Props {
  path: Path;
  pathJsx: JSX.Element;
  value: Value;
  onChange: (newValue: unknown) => void;
  onPropertyChange: (keyOrIndex: string | number, newValue: unknown) => void;
  editable?: boolean;
  getLockedPaths: () => Path[];
  addLockPath: (path: Path) => void;
  removeLockPath: (path: Path) => void;
}

const nonEditable: ValueType[] = ['function', 'null', 'undefined'];

export function ValueView(props: Props) {
  const type = () => getSpecificType(props.value);
  const value = () => {
    const valueType = type();
    if (valueType === 'null') return null;
    if (valueType === 'undefined') return undefined;
    if (valueType === 'function') return 'function';
    return props.value;
  };
  const toggleLock = (path: Path) => {
    if (getLockStatus(() => path, props.getLockedPaths) === 'locked') props.removeLockPath(path);
    if (getLockStatus(() => path, props.getLockedPaths) === 'unlocked') props.addLockPath(path);
  };
  return (
    <div class="flex gap-2 flex-col py-1 px-2 overflow-auto flex-1">
      <p>
        <span class="font-bold text-sm">{props.pathJsx}</span>
        <Show when={!props.editable}>
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
            value={value() as string}
            editable={props.editable}
            onChange={props.onChange}
            lockStatus={getLockStatus(() => props.path, props.getLockedPaths)}
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
