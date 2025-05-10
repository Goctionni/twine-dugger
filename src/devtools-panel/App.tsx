import { onCleanup } from 'solid-js';
import { api } from './api';

function App() {
  const doPing = async () => {
    const result = await api.ping();
    console.log('api.ping result', result);
  };

  const getState = async () => {
    console.log(await api.state.getState());
  };

  onCleanup(() => {
    // port.disconnect();
  });

  return (
    <div style={{ padding: '1em' }}>
      <h1>Twine Dugger PoC</h1>
      <p>Hello world</p>
      <button on:click={doPing} type="button">
        Ping
      </button>
      <button on:click={getState} type="button">
        get state
      </button>
    </div>
  );
}

export default App;
