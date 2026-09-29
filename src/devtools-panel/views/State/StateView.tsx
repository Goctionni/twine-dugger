import { createMemo, Repeat } from 'solid-js';

import { createGetViewState, getActiveState } from '@/devtools-panel/store/store';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';

import { ObjectNav } from './ObjectNav';
import { ValueView } from './ValueView';

const getPath = createGetViewState('state', 'path');

export function StateView() {
  // Both memos only notify when their value changes, so editing a value along the path doesn't
  // touch the columns: each column reads what it needs from the state itself.
  const leafIsContainer = createMemo(() =>
    isContainerType(getJsonType(getPathValue(getActiveState(), getPath()))),
  );
  const numColumns = createMemo(() => getPath().length + (leafIsContainer() ? 1 : 0));

  return (
    <div class="flex h-[calc(100%-3rem)] py-1">
      <Repeat count={numColumns()}>{(depth) => <ObjectNav depth={depth} />}</Repeat>
      <ValueView />
    </div>
  );
}
