import { getLatestState } from '@/devtools-panel/store/game-state';
import { setNavigationPage, setViewState } from '@/devtools-panel/store/store';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { RenderValue } from '@/devtools-panel/views/DiffLog/RenderValue';
import { getPathValue } from '@/shared/json-safe';
import type { JSONSafeValue } from '@/shared/shared-types';

import type { StateMatcherHit } from '../types';

interface Props {
  hit: StateMatcherHit;
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
      <div class="font-mono text-sm break-all">
        {/* TODO: Add input back */}
        <RenderValue value={getPathValue(getLatestState(), props.hit.path) as JSONSafeValue} />
      </div>
      <div>
        <button type="button" class={btnClass('contained')} onClick={showInState}>
          Show in State view
        </button>
      </div>
    </div>
  );
}
