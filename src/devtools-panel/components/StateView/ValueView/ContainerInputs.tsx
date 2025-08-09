import { ArrayValue, MapValue, ObjectValue, Path, Value } from '@/shared/shared-types';
import { Index, Match, Show, Switch } from 'solid-js';
import { TypeIcon } from '../TypeIcon';
import { BooleanInput, NumberInput, StringInput } from './PrimitiveInputs';
import { getSpecificType } from '@/shared/type-helpers';
import { getLockStatus } from '@/devtools-panel/utils/is-locked';

interface ObjectInputProps {
  getLockedPaths: () => Path[];
  addLockPath: (path: Path) => void;
  removeLockPath: (path: Path) => void;
  path: Path;
  value: ObjectValue;
  editable?: boolean;
  onChange: (keyOrIndex: string, newValue: Value) => void;
}

export function ObjectInput(props: ObjectInputProps) {
  const keys = () => Object.keys(props.value).sort();
  return (
    <ContainerInput
      path={props.path}
      addLockPath={props.addLockPath}
      removeLockPath={props.removeLockPath}
      getLockedPaths={props.getLockedPaths}
      keys={keys()}
      editable={props.editable}
      getKeyValue={(key) => props.value[key]}
      onChange={props.onChange}
    />
  );
}

interface MapInputProps {
  getLockedPaths: () => Path[];
  addLockPath: (path: Path) => void;
  removeLockPath: (path: Path) => void;
  path: Path;
  value: MapValue;
  editable?: boolean;
  onChange: (keyOrIndex: string, newValue: Value) => void;
}

export function MapInput(props: MapInputProps) {
  const keys = () => [...props.value.keys()].sort();
  return (
    <ContainerInput
      path={props.path}
      addLockPath={props.addLockPath}
      removeLockPath={props.removeLockPath}
      getLockedPaths={props.getLockedPaths}
      keys={keys()}
      editable={props.editable}
      getKeyValue={(key) => props.value.get(key)}
      onChange={props.onChange}
    />
  );
}

interface ArrayInputProps {
  getLockedPaths: () => Path[];
  addLockPath: (path: Path) => void;
  removeLockPath: (path: Path) => void;
  path: Path;
  value: ArrayValue;
  editable?: boolean;
  onChange: (keyOrIndex: number, newValue: Value) => void;
}

export function ArrayInput(props: ArrayInputProps) {
  const keys = () => [...props.value.keys()].sort();
  return (
    <ContainerInput
      path={props.path}
      addLockPath={props.addLockPath}
      removeLockPath={props.removeLockPath}
      getLockedPaths={props.getLockedPaths}
      keys={keys()}
      editable={props.editable}
      getKeyValue={(key) => props.value[key]}
      onChange={props.onChange}
    />
  );
}

interface ContainerInputProps<TKey extends string | number> {
  getLockedPaths: () => Path[];
  addLockPath: (path: Path) => void;
  removeLockPath: (path: Path) => void;
  path: Path;
  keys: TKey[];
  editable?: boolean;
  getKeyValue: (key: TKey) => Value;
  onChange: (keyOrIndex: TKey, newValue: Value) => void;
}

export function ContainerInput<TKey extends string | number>(props: ContainerInputProps<TKey>) {
  return (
    <div class="grid grid-cols-[20px_auto_1fr] auto-rows-fr items-center gap-2 py-2 px-3">
      <Index each={props.keys}>
        {(key) => {
          const value = () => props.getKeyValue(key());
          const type = () => getSpecificType(value());
          const getPath = () => [...props.path, key()];
          const toggleLock = () => {
            if (getLockStatus(getPath, props.getLockedPaths) === 'locked')
              props.removeLockPath(getPath());
            if (getLockStatus(getPath, props.getLockedPaths) === 'unlocked')
              props.addLockPath(getPath());
          };

          return (
            <Show when={['string', 'number', 'boolean'].includes(type())}>
              <TypeIcon type={type()} />
              <span class="">{key()}</span>
              <div>
                <Switch fallback={<div class="mono">{type()}</div>}>
                  <Match when={type() === 'string'}>
                    <StringInput
                      value={value() as string}
                      editable={props.editable}
                      onChange={(newValue) => props.onChange?.(key(), newValue)}
                      lockStatus={getLockStatus(getPath, props.getLockedPaths)}
                      toggleLock={toggleLock}
                    />
                  </Match>
                  <Match when={type() === 'number'}>
                    <NumberInput
                      value={value() as number}
                      editable={props.editable}
                      onChange={(newValue) => props.onChange?.(key(), newValue)}
                      lockStatus={getLockStatus(getPath, props.getLockedPaths)}
                      toggleLock={toggleLock}
                    />
                  </Match>
                  <Match when={type() === 'boolean'}>
                    <BooleanInput
                      value={value() as boolean}
                      editable={props.editable}
                      onChange={(newValue) => props.onChange?.(key(), newValue)}
                      lockStatus={getLockStatus(getPath, props.getLockedPaths)}
                      toggleLock={toggleLock}
                    />
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
