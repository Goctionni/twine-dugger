import { createGetViewState, setViewState } from '../../store';
import { StringInput } from '../../ui/inputs/StringInput';

export function SearchInput() {
  const getQuery = createGetViewState('search', 'query');
  const setQuery = (value: string) => setViewState('search', 'query', value);

  return (
    <div class="px-4 py-3">
      <StringInput
        value={getQuery()}
        onChange={setQuery}
        placeholder="Search..."
        autoFocus
        class="w-full"
      />
    </div>
  );
}
