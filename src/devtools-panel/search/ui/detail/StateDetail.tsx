import { Match, Switch } from 'solid-js';

import { setNavigationPage, setViewState } from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { StateBooleanInput } from '@/devtools-panel/views/State/StateInputs/StateBooleanInput';
import { StateNumberInput } from '@/devtools-panel/views/State/StateInputs/StateNumberInput';
import { StateStringInput } from '@/devtools-panel/views/State/StateInputs/StateStringInput';

import type { StateHit } from '../../core/types';

interface Props {
  hit: StateHit;
}

/** The value is the live one, with the inputs of the State page: a hit only has the value it was found with */
export function StateDetail(props: Props) {
  const showInState = () => {
    setNavigationPage('state');
    setViewState('state', 'path', [...props.hit.path]);
  };

  return (
    <div class="flex flex-col gap-3 p-3">
      <div class="flex items-center gap-2">
        <TypeIcon type={props.hit.type} />
        <span class="text-sm font-semibold">{props.hit.type}</span>
      </div>
      <PrettyPath class="font-mono text-sm font-bold break-all" path={props.hit.path} statePrefix />
      <Switch>
        <Match when={props.hit.type === 'string'}>
          <StateStringInput path={props.hit.path} />
        </Match>
        <Match when={props.hit.type === 'number'}>
          <StateNumberInput path={props.hit.path} />
        </Match>
        <Match when={props.hit.type === 'boolean'}>
          <StateBooleanInput path={props.hit.path} />
        </Match>
      </Switch>
      <div>
        <button type="button" class={btnClass('contained')} onClick={showInState}>
          Show in State view
        </button>
      </div>
    </div>
  );
}
