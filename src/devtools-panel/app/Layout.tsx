import { JSX } from 'solid-js';

import { createContextMenuHandler } from '../ui/util/ContextMenu';
import { Header } from './Header';

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
      <div class="flex h-screen flex-col bg-gray-900 text-gray-100" onContextMenu={onContextMenu}>
        <Header />
        {props.children}
      </div>
    </>
  );
}
