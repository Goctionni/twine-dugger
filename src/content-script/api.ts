import { Diff, Value } from './util/types';

export const api = {
  state: {
    async getState(): Promise<Value> {
      console.log('CS: getState called');
      // Actual logic to get state from the page
      const result = await chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        world: 'MAIN',
        func: () => {
          return SugarCube.State.variables;
        },
      });
      console.log('SugarCube.State.variables', result);
      return result;
    },
    async updateValue(path: string[], value: Value): Promise<void> {
      console.log('CS: updateValue called with path:', path, 'value:', value);
      // Actual logic to update value in the page
      return; // Promise<void> resolves
    },
    async getDiffs(): Promise<Diff[]> {
      console.log('CS: getDiffs called');
      // Actual logic to get diffs
      return [];
    },
  },
  system: {
    async disconnect(): Promise<void> {
      console.log('CS: disconnect called. Cleaning up resources.');
      // Perform any cleanup needed in the content script
      // Potentially stop listening for further messages if appropriate
      // Note: The content script itself doesn't "disconnect" the chrome.runtime listeners
      // unless you explicitly remove them. This is more of an application-level signal.
      return;
    },
  },
  async ping(): Promise<'pong'> {
    return 'pong';
  },
} as const;

export type Api = typeof api;
