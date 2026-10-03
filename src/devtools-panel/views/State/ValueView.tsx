import { createMemo, Match, Show, Switch } from 'solid-js';

import { getActiveState } from '@/devtools-panel/store/game-state';
import { createGetViewState } from '@/devtools-panel/store/store';
import type { ContainerType } from '@/shared/json-safe';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import { PrettyPath } from '../../ui/display/PrettyPath';
import { TypeIcon } from '../../ui/display/TypeIcon';
import { RenderValue } from '../DiffLog/RenderValue';
import { StateBooleanInput } from './StateInputs/StateBooleanInput';
import { StateContainerInput } from './StateInputs/StateContainerInput';
import { StateNumberInput } from './StateInputs/StateNumberInput';
import { StateStringInput } from './StateInputs/StateStringInput';

const getPath = createGetViewState('state', 'path');
const getHistoryRef = createGetViewState('state', 'historyRef');

export function ValueView() {
  const value = () => getPathValue(getActiveState(), getPath());
  const type = createMemo(() => getJsonType(value()));
  const isReadOnly = () => getHistoryRef() !== 'latest';
  let scrollElRef: HTMLDivElement | undefined;

  return (
    <div class="flex min-h-0 flex-1 flex-col gap-2 px-2 py-1">
      <p>
        <PrettyPath class="font-mono text-sm font-bold" path={getPath()} statePrefix />
        <Show when={isReadOnly()}>
          <span class="ml-2 text-red-400">(readonly)</span>
        </Show>
      </p>
      <p class="flex items-center gap-1">
        <TypeIcon type={type()} />
        <span class="font-mono">{type()}</span>
      </p>
      <div class="min-h-0 flex-1 overflow-auto" ref={scrollElRef}>
        <Switch>
          <Match when={type() === 'string'}>
            <StateStringInput path={getPath()} />
          </Match>
          <Match when={type() === 'number'}>
            <StateNumberInput path={getPath()} />
          </Match>
          <Match when={type() === 'boolean'}>
            <StateBooleanInput path={getPath()} />
          </Match>
          <Match when={isContainerType(type())}>
            <StateContainerInput
              path={getPath()}
              getValue={value}
              getType={() => type() as ContainerType}
              getScrollElement={() => scrollElRef}
            />
          </Match>
          <Match when={type() === 'function'}>
            <pre class="font-mono text-sm whitespace-pre-wrap">
              {(value() as { str: string } | undefined)?.str}
            </pre>
          </Match>
          <Match when={type() === 'date'}>
            <p class="font-mono">{formatDate(value() as Record<string, number>)}</p>
          </Match>
          <Match when={true}>
            <p>
              <RenderValue value={value() as JSONSafeValue} />
            </p>
          </Match>
        </Switch>
      </div>
    </div>
  );
}

function formatDate({ Y, M, D, h, m, s }: Record<string, number> = {}) {
  const pad = (n = 0) => `${n}`.padStart(2, '0');
  return `${Y}-${pad(M)}-${pad(D)} ${pad(h)}:${pad(m)}:${pad(s)}`;
}
