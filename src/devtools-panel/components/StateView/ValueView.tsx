import { ArrayValue, MapValue, ObjectValue, Value, ValueType } from '@/shared/shared-types';
import { JSX, Match, Show, Switch } from 'solid-js';
import { TypeIcon } from './TypeIcon';
import { BooleanInput, NumberInput, StringInput } from './ValueView/PrimitiveInputs';
import { ArrayInput, MapInput, ObjectInput } from './ValueView/ContainerInputs';
import { getSpecificType } from '@/shared/type-helpers';

interface Props {
  path: JSX.Element;
  value: Value;
  onChange: (newValue: unknown) => void;
  onPropertyChange: (keyOrIndex: string | number, newValue: unknown) => void;
  editable?: boolean;
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
  return (
    <div class="flex gap-2 flex-col py-1 px-2 overflow-auto flex-1">
      <p>
        <span class="font-bold text-sm">{props.path}</span>
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
          />
        </Match>
        <Match when={type() === 'number'}>
          <NumberInput
            value={value() as number}
            editable={props.editable}
            onChange={props.onChange}
          />
        </Match>
        <Match when={type() === 'boolean'}>
          <BooleanInput
            value={value() as boolean}
            editable={props.editable}
            onChange={props.onChange}
          />
        </Match>
        <Match when={type() === 'object'}>
          <ObjectInput
            value={value() as ObjectValue}
            editable={props.editable}
            onChange={props.onPropertyChange}
          />
        </Match>
        <Match when={type() === 'map'}>
          <MapInput
            value={value() as MapValue}
            editable={props.editable}
            onChange={props.onPropertyChange}
          />
        </Match>
        <Match when={type() === 'array'}>
          <ArrayInput
            value={value() as ArrayValue}
            editable={props.editable}
            onChange={props.onPropertyChange}
          />
        </Match>
      </Switch>
    </div>
  );
}
