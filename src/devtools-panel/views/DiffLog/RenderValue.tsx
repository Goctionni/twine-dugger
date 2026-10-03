import clsx from 'clsx';
import { Match, Switch } from 'solid-js';

import { Tooltip } from '@/devtools-panel/ui/display/Tooltip';
import { getJsonType } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { DiffPreview } from './DiffPreview';

const colorClasses = {
  typeNumber: 'text-emerald-300 saturate-50',
  typeString: 'text-orange-300 saturate-50',
  typeBoolean: 'text-blue-500',
  typeEmpty: 'text-gray-400',
  typeOther: 'text-purple-300',
} as const;

export function RenderValue(props: { value: JSONSafeValue; faded?: boolean }) {
  const fadedCls = () => (props.faded ? 'opacity-60 saturate-50' : '');
  const renderType = () => {
    const t = typeof props.value;
    if (t === 'string' && !props.value) return 'empty';
    if (t === 'string' || t === 'boolean' || t === 'number') return t;
    return 'type';
  };
  return (
    <Switch fallback={<RenderValueFallback value={props.value} faded={props.faded} />}>
      <Match when={renderType() === 'empty'}>
        <code class={clsx(colorClasses.typeEmpty, fadedCls())}>""</code>
      </Match>
      <Match when={renderType() === 'boolean'}>
        <code class={clsx(colorClasses.typeBoolean, fadedCls())}>
          {JSON.stringify(props.value)}
        </code>
      </Match>
      <Match when={renderType() === 'number'}>
        <code class={clsx(colorClasses.typeNumber, fadedCls())}>{props.value as number}</code>
      </Match>
      <Match when={renderType() === 'string'}>
        <code class={clsx(colorClasses.typeString, fadedCls())}>{JSON.stringify(props.value)}</code>
      </Match>
    </Switch>
  );
}

interface RenderValueFallbackProps {
  value: JSONSafeValue;
  faded?: boolean;
}

function RenderValueFallback(props: RenderValueFallbackProps) {
  const fadedCls = () => (props.faded ? 'opacity-60 saturate-50' : '');

  const base = () => (
    <code class={clsx(colorClasses.typeOther, fadedCls())}>{getJsonType(props.value)}</code>
  );

  return (
    <Switch fallback={base()}>
      <Match when={props.value && typeof props.value === 'object'}>
        <Tooltip
          area="bottom right"
          element={(elProps) => (
            <span
              {...elProps}
              class={clsx('inline-flex cursor-help items-center gap-1', elProps.class)}
            >
              <span class="material-symbols-outlined align-middle text-xs text-white">search</span>
              {base()}
            </span>
          )}
          tooltip={<DiffPreview value={props.value} />}
        />
      </Match>
    </Switch>
  );
}
