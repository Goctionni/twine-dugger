import { createEffect, createSignal, onCleanup } from 'solid-js';

import { createGetViewState, setViewState } from '../../store';
import { StringInput } from '../../ui/inputs/StringInput';

const FIRST_KEY_DEBOUNCE_MS = 450;
const SUBSEQUENT_KEY_DEBOUNCE_MS = 150;

export function SearchInput() {
  const getQuery = createGetViewState('search', 'query');
  const setQuery = (value: string) => setViewState('search', 'query', value);
  const [localValue, setLocalValue] = createSignal(getQuery());
  let debounceTimeout: number | undefined;

  createEffect(() => {
    const currentQuery = getQuery();
    if (currentQuery !== localValue()) {
      setLocalValue(currentQuery);
    }
  });

  createEffect(() => {
    const value = localValue();
    const currentQuery = getQuery();
    if (value === currentQuery) return;

    clearTimeout(debounceTimeout);
    const delay = value.length <= 1 ? FIRST_KEY_DEBOUNCE_MS : SUBSEQUENT_KEY_DEBOUNCE_MS;
    debounceTimeout = window.setTimeout(() => setQuery(value), delay);
    onCleanup(() => clearTimeout(debounceTimeout));
  });

  return (
    <div class="px-4 py-3">
      <StringInput
        value={localValue()}
        onChange={setLocalValue}
        placeholder="Search..."
        autoFocus
        class="w-full"
      />
    </div>
  );
}
