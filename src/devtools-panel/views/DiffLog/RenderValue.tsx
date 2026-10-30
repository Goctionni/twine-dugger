import clsx from 'clsx';
import { Match, Switch } from 'solid-js';

import { Tooltip } from '@/devtools-panel/ui/display/Tooltip';
import {
  getDateText,
  getJsonType,
  getMarkedValueText,
  isContainerType,
  type DateMarker,
} from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { DiffPreview } from './DiffPreview';

const colorClasses = {
  typeNumber: 'text-emerald-300 saturate-50',
  typeString: 'text-orange-300 saturate-50',
  typeBoolean: 'text-blue-500',
  typeEmpty: 'text-gray-400',
  typeOther: 'text-purple-300',
} as const;

interface Props {
  value: JSONSafeValue;
  faded?: boolean;
  disableInvalidHighlight?: boolean;
}

export function RenderValue(props: Props) {
  const fadedCls = () => (props.faded ? 'opacity-60 saturate-50' : '');
  const renderType = () => {
    const t = typeof props.value;
    // Before the strings: a Date is one
    if (getJsonType(props.value) === 'date') return 'date';
    if (getMarkedValueText(props.value)) {
      return !props.disableInvalidHighlight && getJsonType(props.value) !== 'undefined'
        ? 'invalid-number'
        : 'marked';
    }
    if (t === 'string' && !props.value) return 'empty';
    if (t === 'string' || t === 'boolean' || t === 'number') return t;
    return 'type';
  };
  return (
    <Switch fallback={<RenderValueFallback value={props.value} faded={props.faded} />}>
      <Match when={renderType() === 'empty'}>
        <code class={clsx(colorClasses.typeEmpty, fadedCls())}>""</code>
      </Match>
      <Match when={renderType() === 'invalid-number'}>
        <code
          class={clsx('rounded-xs bg-red-600 px-1 font-semibold text-white', fadedCls())}
          title="Not a valid number"
        >
          {getMarkedValueText(props.value)}
        </code>
      </Match>
      <Match when={renderType() === 'marked'}>
        <code class={clsx(colorClasses.typeEmpty, fadedCls())}>
          {getMarkedValueText(props.value)}
        </code>
      </Match>
      <Match when={renderType() === 'date'}>
        <code class={clsx(colorClasses.typeOther, fadedCls())} title="Date">
          {getDateText(props.value as DateMarker)}
        </code>
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
      {/* Only what the preview shows: it hands anything else (a Date, a function) back to RenderValue */}
      <Match when={isContainerType(getJsonType(props.value))}>
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
