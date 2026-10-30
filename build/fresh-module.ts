import { statSync } from 'fs';
import { pathToFileURL } from 'url';

/**
 * The exports of a module, loaded again when its file has changed since the last time. The config
 * of the build is loaded once, so in watch mode a change in a file it imports is not seen
 * otherwise. Call the result where the module is used, once per build.
 */
export function createFreshModule<T extends object>(file: string, loaded: T) {
  let loadedAt = statSync(file).mtimeMs;
  let current = loaded;

  return async (): Promise<T> => {
    const modifiedAt = statSync(file).mtimeMs;
    if (modifiedAt !== loadedAt) {
      // A new query is a new module for node, which keeps the ones it has loaded
      current = (await import(`${pathToFileURL(file).href}?modified=${modifiedAt}`)) as T;
      loadedAt = modifiedAt;
      console.log(`[watch] reloaded ${file}`);
    }
    return current;
  };
}
