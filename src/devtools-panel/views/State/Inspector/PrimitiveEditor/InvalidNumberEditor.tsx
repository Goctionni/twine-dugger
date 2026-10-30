import { setState } from '@/devtools-panel/api/api';
import { getLatestState } from '@/devtools-panel/store/game-state';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { getMarkedValueText, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { createEditStatus } from '../createEditStatus';
import { createValueHistory } from '../createValueHistory';
import { formatAsJson } from '../logic/info';
import { getLastValidValue } from '../logic/value-history';

interface Props {
  path: Path;
}

/** NaN or an infinity: shown as what it is, with a way back to a number. The panel does not write these values */
export function InvalidNumberEditor(props: Props) {
  const { canChange } = createEditStatus(() => props.path);
  const getHistory = createValueHistory(() => props.path);
  const getText = () => getMarkedValueText(getPathValue(getLatestState(), props.path));
  const getValidValue = () => getLastValidValue(getHistory().entries);
  const hasValidValue = () => getValidValue() !== undefined;

  // Back to what it was before it went wrong, or to 0 when nothing is known
  const getReplacement = () => (hasValidValue() ? getValidValue()! : 0);

  return (
    <div class="flex items-center gap-1">
      {/* Looks like a disabled input of a number (faded as the concept's disabled input): the value cannot be edited */}
      <code
        class={[
          baseInputClasses,
          'flex h-7.5 min-w-0 flex-1 items-center justify-center rounded-md font-mono opacity-50',
        ]}
      >
        {getText()}
      </code>
      <button
        type="button"
        class={btnClass('outline', 'clr-gray')}
        disabled={!canChange()}
        title={`Write ${formatAsJson(getReplacement())}`}
        onClick={() => void setState(props.path, getReplacement())}
      >
        {hasValidValue() ? 'Revert' : 'Set to 0'}
      </button>
    </div>
  );
}
