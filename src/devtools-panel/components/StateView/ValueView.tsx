import { ArrayValue, MapValue, ObjectValue } from '@/shared/shared-types';
import { SelectedValue } from './types';
import { JSX, Match, Switch } from 'solid-js';
import { TypeIcon } from './TypeIcon';
import { BooleanInput, NumberInput, StringInput } from './ValueView/PrimitiveInputs';
import { ArrayInput, MapInput, ObjectInput } from './ValueView/ContainerInputs';

interface Props {
  path: JSX.Element;
  selectedValue: SelectedValue;
  onChange: (newValue: unknown, keyOrIndex?: string | number) => void;
  editable?: boolean;
}

type SelectedType = SelectedValue['type'];
const nonEditable: SelectedType[] = ['function', 'null', 'undefined'];

export function ValueView(props: Props) {
  const type = () => props.selectedValue.type;
  const value = () => {
    const selected = props.selectedValue;
    if (selected.type === 'null') return null;
    if (selected.type === 'undefined') return undefined;
    if (selected.type === 'function') return 'function';
    return selected.value;
  };
  return (
    <div class="flex gap-2 flex-col py-1 px-2 overflow-auto flex-1">
      <p>
        <span class="font-bold text-sm">{props.path}</span>
      </p>
      <p class="flex items-center gap-1">
        <TypeIcon type={type()} />
        <span class="font-mono">{type()}</span>
      </p>
      {props.editable && (
        <Switch fallback={<p>Input for this type is not implemented yet</p>}>
          <Match when={nonEditable.includes(type())}>
            <p>Values of this type cannot be edited</p>
          </Match>
          <Match when={type() === 'string'}>
            <StringInput value={value() as string} onChange={props.onChange} />
          </Match>
          <Match when={type() === 'number'}>
            <NumberInput value={value() as number} onChange={props.onChange} />
          </Match>
          <Match when={type() === 'boolean'}>
            <BooleanInput value={value() as boolean} onChange={props.onChange} />
          </Match>
          <Match when={type() === 'object'}>
            <ObjectInput value={value() as ObjectValue} onChange={props.onChange} />
          </Match>
          <Match when={type() === 'map'}>
            <MapInput value={value() as MapValue} onChange={props.onChange} />
          </Match>
          <Match when={type() === 'array'}>
            <ArrayInput value={value() as ArrayValue} onChange={props.onChange} />
          </Match>
        </Switch>
      )}
    </div>
  );
}
