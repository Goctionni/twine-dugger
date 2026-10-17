import { createSignal } from 'solid-js';

import { StateNav } from './Navigators/StateNav';
import { Toolbar } from './Toolbar/Toolbar';
import type { Navigator } from './types';

const mockPath = ['character', 'stats', 'fitness'];

export function StateView() {
  const [getNavigator, setNavigator] = createSignal<Navigator>('miller');

  return (
    <div class="flex h-full flex-col">
      <Toolbar navigator={getNavigator()} onNavigatorChange={setNavigator} />
      <div class="min-h-0 flex-1">
        <StateNav navigator={getNavigator()} path={mockPath} selectionKind="container" />
      </div>
    </div>
  );
}
