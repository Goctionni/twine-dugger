import { ArrayValue, MapValue, ObjectValue, SetValue, Value } from '@/content-script/util/types';
import { Index, Match, Show, Switch } from 'solid-js';
import { getSpecificType } from '../watchState';
import { TypeIcon } from '../TypeIcon';
import { BooleanInput, NumberInput, StringInput } from './PrimitiveInputs';

interface ObjectInputProps {
  value: ObjectValue;
  onChange: (newValue: Value, keyOrIndex: string) => void;
}

export function ObjectInput(props: ObjectInputProps) {
  const keys = () => Object.keys(props.value).sort();
  return (
    <ContainerInput
      keys={keys()}
      getKeyValue={(key) => props.value[key]}
      onChange={props.onChange}
    />
  );
}

interface MapInputProps {
  value: MapValue;
  onChange: (newValue: Value, keyOrIndex: string) => void;
}

export function MapInput(props: MapInputProps) {
  const keys = () => [...props.value.keys()].sort();
  return (
    <ContainerInput
      keys={keys()}
      getKeyValue={(key) => props.value.get(key)}
      onChange={props.onChange}
    />
  );
}

interface ArrayInputProps {
  value: ArrayValue;
  onChange: (newValue: Value, keyOrIndex: number) => void;
}

export function ArrayInput(props: ArrayInputProps) {
  const keys = () => [...props.value.keys()].sort();
  return (
    <ContainerInput
      keys={keys()}
      getKeyValue={(key) => props.value[key]}
      onChange={props.onChange}
    />
  );
}

interface ContainerInputProps<TKey extends string | number> {
  keys: TKey[];
  getKeyValue: (key: TKey) => Value;
  onChange: (newValue: Value, keyOrIndex: TKey) => void;
}

export function ContainerInput<TKey extends string | number>(props: ContainerInputProps<TKey>) {
  return (
    <div class="grid grid-cols-[20px_auto_1fr] auto-rows-fr items-center gap-2 py-2 px-3">
      <Index each={props.keys}>
        {(key) => {
          const value = () => props.getKeyValue(key());
          const type = () => getSpecificType(value());
          return (
            <Show when={['string', 'number', 'boolean'].includes(type())}>
              <TypeIcon type={type()} />
              <span class="">{key()}</span>
              <div>
                <Switch fallback={<div class="mono">{type()}</div>}>
                  <Match when={type() === 'string'}>
                    <StringInput
                      value={value() as string}
                      onChange={(newValue) => props.onChange?.(newValue, key())}
                    />
                  </Match>
                  <Match when={type() === 'number'}>
                    <NumberInput
                      value={value() as number}
                      onChange={(newValue) => props.onChange?.(newValue, key())}
                    />
                  </Match>
                  <Match when={type() === 'boolean'}>
                    <BooleanInput
                      value={value() as boolean}
                      onChange={(newValue) => props.onChange?.(newValue, key())}
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
