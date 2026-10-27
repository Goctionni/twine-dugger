import { Match, Switch } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { showInStatePage } from '@/devtools-panel/store/state-location';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { InspectorContent } from '@/devtools-panel/views/State/Inspector/InspectorContent';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';

import type { StateMatcherHit } from '../types';

interface Props {
  hit: StateMatcherHit;
}

/** The editor of the State page, for the live value: a hit only has the value it was found with */
export function StateDetail(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.hit.path);

  return (
    <div class="flex flex-col">
      <div class="px-3 pt-3">
        <button
          type="button"
          class={btnClass('contained')}
          onClick={() => showInStatePage(props.hit.path)}
        >
          Show in State view
        </button>
      </div>
      <Switch>
        <Match when={getValue() === undefined}>
          <div class="flex flex-col gap-2 p-3 text-sm text-slate-400">
            <PrettyPath class="font-mono break-all" path={props.hit.path} statePrefix />
            <p>This value is no longer in the state.</p>
          </div>
        </Match>
        <Match when={getValue() !== undefined}>
          <InspectorContent
            path={props.hit.path}
            onSelect={showInStatePage}
            selectionKind={isContainerType(getJsonType(getValue())) ? 'container' : 'primitive'}
          />
        </Match>
      </Switch>
    </div>
  );
}
