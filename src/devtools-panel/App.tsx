import { createResource, createSignal, Match, Switch } from 'solid-js';

import { PromptDialogOutlet } from './components/Common/PromptProvider';
import { Content } from './components/Content';
import { ContextMenuUI } from './components/ContextMenu';
import { Layout } from './components/Layout/Layout';
import { getGameMetaData } from './utils/api';

function App() {
  const [enabled, setEnabled] = createSignal(false);
  const [killed, setKilled] = createSignal(false);
  const [resource, { mutate }] = createResource(() => getGameMetaData());

  const state = () => {
    if (killed()) return 'killed';
    if (!resource.latest && !resource.error) return 'loading';
    if (resource.error) return 'error';
    if (enabled()) return 'content';
    return 'not-enabled';
  };

  const kill = () => {
    setKilled(true);
    mutate(undefined);
  };

  return (
    <Layout meta={resource()}>
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
        <Match when={state() === 'content'}>
          <Content kill={kill} />
        </Match>
        <Match when={state() === 'not-enabled'}>
          <div class="flex-grow flex flex-col items-center justify-center gap-4">
            Start watching game-state?
            <button
              class="px-3 py-2 rounded-full bg-sky-500 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              type="button"
              on:click={() => setEnabled(true)}
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
