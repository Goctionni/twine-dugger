import { JSX } from 'solid-js';
import { MetaInfo } from './MetaInfo';
import { CogIcon } from './CogIcon';
import { GameMetaData } from '@/devtools-panel/utils/remote-functions/getMetaData';

interface LayoutProps {
  meta?: GameMetaData | null;
  children: JSX.Element;
}

export function Layout(props: LayoutProps) {
  const handleOptionsClick = () => {
    console.log('Options clicked!');
  };

  return (
    <div class="bg-gray-900 text-gray-100 h-screen flex flex-col">
      {/* Top Bar */}
      <header class="bg-gray-800 p-3 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-sky-400">Twine Dugger</h1>
          {props.meta && <MetaInfo {...props.meta} />}
        </div>
        <button
          onClick={handleOptionsClick}
          class="cursor-pointer p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Options"
        >
          <CogIcon class="h-6 w-6 text-gray-400 hover:text-sky-400" />
        </button>
      </header>
      {props.children}
    </div>
  );
}
