import { JSX } from 'solid-js';

import { getGameMetaData } from '../../store/store';
import { createContextMenuHandler } from '../ContextMenu';
import { MetaInfo } from './MetaInfo';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout(props: LayoutProps) {
  const onContextMenu = createContextMenuHandler([
    {
      label: 'Reload Twine Dugger',
      onClick: () => window.location.reload(),
    },
  ]);

  return (
    <>
      <div class="bg-gray-900 text-gray-100 h-screen flex flex-col" onContextMenu={onContextMenu}>
        {/* Top Bar */}
        <header class="bg-gray-800 p-3 shadow-md flex justify-between items-center sticky top-0 z-10">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-semibold text-sky-400">Twine Dugger</h1>
            {getGameMetaData() && <MetaInfo />}
          </div>
          <Navigation />
        </header>
        {props.children}
      </div>
    </>
  );
}
