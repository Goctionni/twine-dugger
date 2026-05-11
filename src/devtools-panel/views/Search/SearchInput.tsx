import { createEffect, createSignal, onCleanup } from 'solid-js';

import { createGetViewState, setViewState } from '../../store';
import { StringInput } from '../../ui/inputs/StringInput';

const FIRST_KEY_DEBOUNCE_MS = 450;
const SUBSEQUENT_KEY_DEBOUNCE_MS = 150;

export function SearchInput() {
  const getQuery = createGetViewState('search', 'query');
  const setQuery = (value: string) => setViewState('search', 'query', value);
  const [localValue, setLocalValue] = createSignal(getQuery());
  const [hasEdited, setHasEdited] = createSignal(false);
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

  const handleInput = (value: string) => {
    if (!hasEdited()) setHasEdited(true);
    setLocalValue(value);
  };

  createEffect(() => {
    const currentQuery = getQuery();
    if (currentQuery === localValue()) return;

    clearTimeout(debounceTimeout);
    setLocalValue(currentQuery);
  });

  createEffect(() => {
    onCleanup(() => clearTimeout(debounceTimeout));

    const value = localValue();
    const currentQuery = getQuery();
    if (value === currentQuery) return;

    clearTimeout(debounceTimeout);
    const delay = hasEdited() ? SUBSEQUENT_KEY_DEBOUNCE_MS : FIRST_KEY_DEBOUNCE_MS;
    debounceTimeout = window.setTimeout(() => setQuery(value), delay);
  });

  return (
    <div class="px-4 py-3">
      <StringInput
        value={localValue()}
        onChange={handleInput}
        placeholder="Search..."
        autoFocus
        class="w-full"
      />
    </div>
  );
}
