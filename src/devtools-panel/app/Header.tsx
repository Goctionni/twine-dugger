import { getGameMetaData } from '../store';
import { MetaInfo } from '../ui/display/MetaInfo';
import { Navigation } from './Navigation';

export function Header() {
  return (
    <header class="bg-gray-800 p-3 shadow-md flex justify-between items-center sticky top-0 z-10">
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-semibold text-sky-400">Twine Dugger</h1>
        {getGameMetaData() && <MetaInfo />}
      </div>
      <Navigation />
    </header>
  );
}
