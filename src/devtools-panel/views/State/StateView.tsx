import { createMemo, For } from 'solid-js';

import { createGetViewState, getActiveState } from '@/devtools-panel/store/store';
import { getObjectPathValue } from '@/shared/get-object-path-value';

import { ObjectNav } from './ObjectNav';
import { ValueView } from './ValueView';

export function StateView() {
  const getPath = createGetViewState('state', 'path');

  const getNavLayers = createMemo(() => {
    const fullPath = getPath();
    const state = getActiveState()!;
    const value = getObjectPathValue(state, fullPath);
    const leafIsObj = !!value && typeof value === 'object';
    const numLayers = fullPath.length + (leafIsObj ? 1 : 0);

    return new Array(numLayers).fill(0).map((_, index) => {
      const path = fullPath.slice(0, index);
      const selectedProperty = fullPath[index];
      return { path, selectedProperty };
    });
  });

  return (
    <div class="flex h-[calc(100%-3rem)] py-1">
      <For each={getNavLayers()} keyed={false}>
        {(layer) => <ObjectNav path={layer().path} selectedProperty={layer().selectedProperty} />}
      </For>
      <ValueView />
    </div>
  );
}
