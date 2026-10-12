import { getScope, togglePassageScope, toggleStateScope } from '../../store-helpers/search-state';
import { CheckRow } from './CheckRow';

const titleClass = 'px-1 text-xs font-semibold text-slate-400 uppercase';

/** What is searched in. A part that is switched off finds nothing */
export function ScopeFilter() {
  return (
    <div class="flex flex-col gap-2">
      <div>
        <div class={titleClass}>State</div>
        <CheckRow checked={getScope().state.path} onChange={() => toggleStateScope('path')}>
          Path
        </CheckRow>
        <CheckRow checked={getScope().state.value} onChange={() => toggleStateScope('value')}>
          Value
        </CheckRow>
      </div>
      <div>
        <div class={titleClass}>Passages</div>
        <CheckRow checked={getScope().passage.name} onChange={() => togglePassageScope('name')}>
          Name
        </CheckRow>
        <CheckRow checked={getScope().passage.tags} onChange={() => togglePassageScope('tags')}>
          Tags
        </CheckRow>
        <CheckRow
          checked={getScope().passage.content}
          onChange={() => togglePassageScope('content')}
        >
          Content
        </CheckRow>
      </div>
    </div>
  );
}
