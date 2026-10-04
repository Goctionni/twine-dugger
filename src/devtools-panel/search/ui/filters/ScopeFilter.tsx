import { For } from 'solid-js';

import type { SearchScope } from '../../core/types';
import { scopeLabels } from '../../model/active-filters';
import { getScope, toggleScope } from '../../model/search-state';
import { CheckRow } from './CheckRow';

const groups: Array<{ title: string; keys: Array<keyof SearchScope> }> = [
  { title: 'State', keys: ['statePath', 'stateValue'] },
  { title: 'Passages', keys: ['passageName', 'passageTags', 'passageContent'] },
];

/** What is searched in. A part that is switched off finds nothing */
export function ScopeFilter() {
  return (
    <div class="flex flex-col gap-2">
      <For each={groups}>
        {(group) => (
          <div>
            <div class="px-1 text-xs font-semibold text-slate-400 uppercase">{group.title}</div>
            <For each={group.keys}>
              {(key) => (
                <CheckRow checked={getScope()[key]} onChange={() => toggleScope(key)}>
                  {scopeLabels[key]}
                </CheckRow>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
