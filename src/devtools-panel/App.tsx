import { createResource, createSignal, Match, Switch } from 'solid-js';

import { PromptDialogOutlet } from './components/Common/PromptProvider';
import { Content } from './components/Content';
import { ContextMenuUI } from './components/ContextMenu';
import { Layout } from './components/Layout/Layout';
import { getConnectionState, startTrackingFrames } from './store/store';

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
          <Content />
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

export default App;
