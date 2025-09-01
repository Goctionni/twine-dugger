import { For } from 'solid-js';

import { Path } from '@/shared/shared-types';

import { setNavigationPage, setViewState } from '../../store';
import { PrettyPath } from '../../ui/display/PrettyPath';

interface Props {
  results: Path[];
}

export function StateResults(props: Props) {
  const onPathClick = (path: Path) => {
    setNavigationPage('state');
    setViewState('state', 'path', path);
  };

  return (
    <div class="h-full flex-1 overflow-hidden flex flex-col">
      <h1 class="font-bold text-base pt-4 pb-2">State Results</h1>
      <ul class="h-full overflow-auto flex-1">
        <For each={props.results}>
          {(result) => (
            <li class="border-t border-slate-400 last:border-b flex">
              <button
                type="button"
                class="px-4 py-2 font-mono cursor-pointer hover:bg-slate-600 flex-1 text-left"
                onClick={() => onPathClick(result)}
              >
                <PrettyPath path={result} />
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
