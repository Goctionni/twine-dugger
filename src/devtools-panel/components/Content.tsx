import { Match, Switch } from 'solid-js';

import { DiffLog } from './DiffLog';
import { HistoryNav } from './HistoryNav';
import { MovableSplit } from './Layout/MovableSplit';
import { getNavItem } from './Layout/nav-items';
import { StateView } from './StateView/StateView';
import { PassagesView } from './Views/PassagesView';
import { SearchView } from './Views/SearchView';
import { SettingsView } from './Views/SettingsView';

export function Content() {
  return (
    <Switch>
      <Match when={getNavItem().text === 'State'}>
        <MovableSplit
          leftContent={<DiffLog />}
          rightContent={
            <>
              <HistoryNav />
              <StateView />
            </>
          }
        />
      </Match>
      <Match when={getNavItem().text === 'Search'}>
        <SearchView />
      </Match>
      <Match when={getNavItem().text === 'Passages'}>
        <PassagesView />
      </Match>
      <Match when={getNavItem().text === 'Settings'}>
        <SettingsView />
      </Match>
    </Switch>
  );
}
