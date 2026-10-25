import { Show } from 'solid-js';

import { getSearchMatcher, getSearchText } from './state-search';

interface Props {
  /** Whether there is nothing to show in the navigator. The nearest positioned parent is the room it has */
  isEmpty: boolean;
}

/** In the middle of a navigator, when the search leaves nothing in it */
export function NoMatches(props: Props) {
  return (
    <Show when={getSearchMatcher() && props.isEmpty}>
      <div
        role="status"
        class="pointer-events-none absolute top-1/2 left-1/2 w-max max-w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 text-center text-sm text-gray-400"
      >
        <div>No matches for</div>
        <div class="font-mono [overflow-wrap:anywhere] text-gray-100">
          “{getSearchText().trim()}”
        </div>
      </div>
    </Show>
  );
}
