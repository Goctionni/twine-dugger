import { Index, Match, Switch } from 'solid-js';

import { exposeHarloweInternals } from '../api/expose-harlowe-internals';
import { PassagesPage } from '../pages/PassagesPage';
import { SearchPage } from '../pages/SearchPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StatePage } from '../pages/StatePage';
import {
  getConnectionState,
  getGameMetaData,
  getNavigationPage,
  startTrackingFrames,
} from '../store';
import { TooltipOutlet } from '../ui/display/TooltipOutlet';
import { ContextMenuUI } from '../ui/util/ContextMenu';
import { PromptDialogOutlet } from '../ui/util/Prompt';
import { Candidates } from './CandidateFrames';
import { initMeta } from './initMeta';
import { Layout } from './Layout';

initMeta();

export function App() {
  const state = () => getConnectionState();

  const start = async () => {
    const metadata = getGameMetaData();
    if (metadata?.format?.name === 'Harlowe') await exposeHarloweInternals();
    startTrackingFrames();
  };

  return (
    <>
      <Layout>
        <PromptDialogOutlet />
        <ContextMenuUI />
        <Switch>
          <Match when={state() === 'no-game-detected'}>
            <span class="m-auto">No supported game detected</span>
          </Match>
          <Match when={state() === 'candidate-iframes'}>
            <Candidates />
          </Match>
          <Match when={state() === 'killed'}>
            <span class="m-auto">
              Extension has disconnected. Re-open devtools to reinitialize.
            </span>
          </Match>
          <Match when={state() === 'loading-meta'}>
            <span class="m-auto">Retrieving game metadata</span>
          </Match>
          <Match when={state() === 'loading-game'}>
            <span class="m-auto">Initializing link to game</span>
          </Match>
          <Match when={state() === 'error'}>
            <span class="m-auto">An error has occured</span>
          </Match>
          <Match when={state() === 'live'}>
            <LiveContent />
          </Match>
          <Match when={state() === 'incompatible'}>
            <div class="m-auto max-w-2xl">
              <Index each={getGameMetaData()?.incompatible ?? []}>
                {(msg, index) =>
                  index === 0 ? (
                    <h3 class="mb-1 text-lg font-bold text-gray-100">{msg()}</h3>
                  ) : (
                    <p>{msg()}</p>
                  )
                }
              </Index>
            </div>
            <span class="m-auto">{}</span>
          </Match>
          <Match when={state() === 'not-enabled'}>
            <div class="flex grow flex-col items-center justify-center gap-4">
              Start watching game-state?
              <button
                class="cursor-pointer rounded-full bg-sky-500 px-3 py-2 hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                type="button"
                onClick={start}
              >
                Start tracking
              </button>
            </div>
          </Match>
        </Switch>
      </Layout>
      <TooltipOutlet />
    </>
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
