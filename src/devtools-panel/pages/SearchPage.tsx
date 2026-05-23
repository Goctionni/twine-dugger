import { SearchInput } from '../views/Search/SearchInput';
import { SearchResults } from '../views/Search/SearchResults';

export function SearchPage() {
  return (
    <div class="flex h-full w-full flex-col overflow-hidden">
      <SearchInput />
      <SearchResults />
    </div>
  );
}
