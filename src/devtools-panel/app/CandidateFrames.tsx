import { Index, Match, Switch } from 'solid-js';

import { executeCode } from '../api/remote-execute';
import { getCandidateIframes, setConnectionState } from '../store';
import { initMeta } from './initMeta';
function openIframeUrl(url: string) {
  setConnectionState('loading-meta');

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const tryLoadMeta = async (retryCount = 6) => {
    await wait(250);
    if (await initMeta()) return;

    if (retryCount) await tryLoadMeta(retryCount - 1);
  };

  executeCode(
    (url) => {
      location.href = url as string;
    },
    { args: [url] },
  ).finally(() => tryLoadMeta());
}

export function Candidates() {
  const urls = () => getCandidateIframes() ?? [];
  const num = () => urls().length;

  return (
    <div class="m-auto max-w-md">
      <h2 class="text-lg font-bold">No direct game-detection, but...</h2>
      <Switch>
        <Match when={num() === 0}>And something went wrong?</Match>
        <Match when={num() === 1}>
          <p>However, TwineDugger did find an iframe that might contain your game.</p>
        </Match>
        <Match when={num() > 1}>
          <p>However, TwineDugger did find some iframes that might contain your game.</p>
        </Match>
      </Switch>
      <p>
        We cannot access the game directly, but we can open the IFrame in the main window which
        would give the extension access.
      </p>
      <ul class="mt-4 flex flex-col gap-2">
        <Index each={urls()}>
          {(item) => (
            <li class="flex gap-2 items-center">
              <button
                class="
                  px-2 py-0.5
                  shadow-sm rounded-md cursor-pointer
                  text-white text-xs font-medium
                  -outline-offset-2 outline-2 outline-gray-500
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800
                  disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500
                  hover:outline-transparent hover:bg-sky-700 focus:ring-sky-500
                "
                onClick={() => openIframeUrl(item())}
              >
                Open
              </button>
              <code>{item()}</code>
            </li>
          )}
        </Index>
      </ul>
    </div>
  );
}
