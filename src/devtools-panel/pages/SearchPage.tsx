import { SearchInput } from '../views/Search/SearchInput';
import { SearchResults } from '../views/Search/SearchResults';

export function SearchPage() {
  return (
    <div class="w-full h-full flex flex-col overflow-hidden">
      <SearchInput />
      <SearchResults />
    </div>
  );
}
