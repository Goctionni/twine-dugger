import { Match, Switch } from 'solid-js';

import { PassagesPage } from '../pages/PassagesPage';
import { SearchPage } from '../pages/SearchPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StatePage } from '../pages/StatePage';
import { getConnectionState, getNavigationPage, startTrackingFrames } from '../store';
import { ContextMenuUI } from '../ui/util/ContextMenu';
import { PromptDialogOutlet } from '../ui/util/Prompt';
import { Layout } from './Layout';

function App() {
  const state = () => getConnectionState();
  return (
    <Layout>
      <PromptDialogOutlet />
      <ContextMenuUI />
      <Switch>
        <Match when={state() === 'killed'}>
          <span class="m-auto">Extension has disconnected. Re-open devtools to reinitialize.</span>
        </Match>
        <Match when={state() === 'loading'}>
          <span class="m-auto">Retrieving game metadata</span>
        </Match>
        <Match when={state() === 'error'}>
          <span class="m-auto">An error has occured</span>
        </Match>
        <Match when={state() === 'live'}>
          <LiveContent />
        </Match>
        <Match when={state() === 'not-enabled'}>
          <div class="flex-grow flex flex-col items-center justify-center gap-4">
            Start watching game-state?
            <button
              class="px-3 py-2 rounded-full bg-sky-500 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              type="button"
              onClick={() => startTrackingFrames()}
            >
              Start tracking
            </button>
          </div>
        </Match>
      </Switch>
    </Layout>
  );
}

function LiveContent() {
  return (
    <Switch>
      <Match when={getNavigationPage() === 'state'}>
        <StatePage />
      </Match>
      <Match when={getNavigationPage() === 'search'}>
        <SearchPage />
      </Match>
      <Match when={getNavigationPage() === 'passages'}>
        <PassagesPage />
      </Match>
      <Match when={getNavigationPage() === 'settings'}>
        <SettingsPage />
      </Match>
    </Switch>
  );
}

export default App;
