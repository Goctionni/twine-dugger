import { createResource, createSignal, Match, Switch } from 'solid-js';
import { Layout } from './components/Layout/Layout';
import { Content } from './components/Content';
import { getGameMetaData } from './utils/api';

function App() {
  const [enabled, setEnabled] = createSignal(false);
  const [resource] = createResource(() => getGameMetaData());

  const state = () => {
    if (!resource.latest && !resource.error) return 'loading';
    if (resource.error) return 'error';
    if (enabled()) return 'content';
    return 'not-enabled';
  };

  return (
    <Layout meta={resource.latest}>
      <Switch>
        <Match when={state() === 'loading'}>Retrieving game metadata</Match>
        <Match when={state() === 'error'}>An error has occured</Match>
        <Match when={state() === 'content'}>
          <Content />
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
