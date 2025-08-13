import clsx from 'clsx';
import { Match, Switch } from 'solid-js';

import { ObjectValue, Value } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

import { Tooltip } from '../Common/Tooltip';
import { DiffPreview } from './DiffPreview';

const colorClasses = {
  typeNumber: 'text-emerald-300 saturate-50',
  typeString: 'text-orange-300 saturate-50',
  typeBoolean: 'text-blue-500',
  typeEmpty: 'text-gray-400',
  typeOther: 'text-purple-300',
} as const;

export function RenderValue(props: { value: Value; faded?: boolean }) {
  const fadedCls = () => (props.faded ? 'opacity-60 saturate-50' : '');
  const type = () => typeof props.value;
  const renderType = () => {
    const t = type();
    if (t === 'string' && !props.value) return 'empty';
    if (t === 'string') return 'string';
    if (t === 'boolean') return 'boolean';
    if (t === 'number') return 'number';
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
  value: Value;
  faded?: boolean;
}

function RenderValueFallback(props: RenderValueFallbackProps) {
  const fadedCls = () => (props.faded ? 'opacity-60 saturate-50' : '');

  const base = () => (
    <code class={clsx(colorClasses.typeOther, fadedCls())}>{getSpecificType(props.value)}</code>
  );

  return (
    <Switch fallback={base()}>
      <Match when={props.value && typeof props.value === 'object'}>
        <Tooltip
          area="bottom right"
          element={(elProps) => (
            <span
              {...elProps}
              class={clsx('inline-flex items-center gap-1 cursor-help', elProps.class)}
            >
              <span class="material-symbols-outlined text-xs align-middle text-white">search</span>
              {base()}
            </span>
          )}
          tooltip={<DiffPreview value={props.value as ObjectValue} />}
        />
      </Match>
    </Switch>
  );
}
