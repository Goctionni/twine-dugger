import { Match, Show, Switch } from 'solid-js';

import { getJsonType } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import type { Change } from './compare-json';

const shorten = (value?: JSONSafeValue) => {
  const text = JSON.stringify(value) ?? 'undefined';
  return text.length > 40 ? `${text.slice(0, 39)}…` : text;
};

/** One change of the list of changes. A change to a locked property is all red: it blocks saving */
export function ChangeLine(props: { change: Change; isLocked: boolean }) {
  return (
    <div class={{ 'text-red-400': props.isLocked }}>
      <Switch>
        <Match when={props.change.op === 'add'}>
          <span class={{ 'text-green-400': !props.isLocked }}>add</span> {props.change.key} ={' '}
          {shorten(props.change.after)}
        </Match>
        <Match when={props.change.op === 'delete'}>
          <span class={{ 'text-red-400': !props.isLocked }}>delete</span> {props.change.key}
        </Match>
        <Match when={props.change.op === 'set'}>
          {props.change.key} {shorten(props.change.before)} → {shorten(props.change.after)}
          <Show when={getJsonType(props.change.before) !== getJsonType(props.change.after)}>
            <span class={{ 'text-amber-400': !props.isLocked }}>
              {' '}
              ({getJsonType(props.change.before)} → {getJsonType(props.change.after)})
            </span>
          </Show>
        </Match>
      </Switch>
    </div>
  );
}
