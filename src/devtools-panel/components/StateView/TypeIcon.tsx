import { Match, Switch } from 'solid-js';

import { ValueType } from './types';

interface Props {
  type: ValueType;
}

const baseIconClasses =
  'inline-flex items-center justify-center w-5 h-4.5 px-1 rounded-xs text-[10px] font-bold font-mono leading-none align-middle';

export function TypeIcon(props: Props) {
  return (
    <Switch>
      <Match when={props.type === 'function'}>
        <span title={props.type} class={`${baseIconClasses} bg-purple-500 text-white`}>
          ƒ
        </span>
      </Match>
      <Match when={props.type === 'array'}>
        <span title={props.type} class={`${baseIconClasses} bg-sky-500 text-white`}>
          []
        </span>
      </Match>
      <Match when={props.type === 'set'}>
        <span title={props.type} class={`${baseIconClasses} bg-green-500 text-white`}>
          S
        </span>
      </Match>
      <Match when={props.type === 'map'}>
        <span title={props.type} class={`${baseIconClasses} bg-teal-500 text-white`}>
          M
        </span>
      </Match>
      <Match when={props.type === 'object'}>
        <span title={props.type} class={`${baseIconClasses} bg-blue-500 text-white`}>
          {'{}'}
        </span>
      </Match>
      <Match when={props.type === 'string'}>
        <span title={props.type} class={`${baseIconClasses} bg-yellow-400 text-yellow-900`}>
          az
        </span>
      </Match>
      <Match when={props.type === 'number'}>
        <span title={props.type} class={`${baseIconClasses} bg-red-500 text-white`}>
          #
        </span>
      </Match>
      <Match when={props.type === 'boolean'}>
        <span title={props.type} class={`${baseIconClasses} bg-black text-white`}>
          01
        </span>
      </Match>
      <Match when={props.type === 'null'}>
        <span title={props.type} class={`${baseIconClasses} bg-slate-500 text-white`}>
          ø
        </span>
      </Match>
      <Match when={props.type === 'undefined'}>
        <span title={props.type} class={`${baseIconClasses} bg-gray-400 text-gray-800`}>
          ?
        </span>
      </Match>
    </Switch>
  );
}
