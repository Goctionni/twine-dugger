import type { Page } from '@playwright/test';

import {
  baselineMockTwineGameSeed,
  cloneMockTwineGameSeed,
  type MockTwineGameSeed,
} from '../../../src/shared/testing/mock-twine-game';

type InstallOptions = {
  seed?: MockTwineGameSeed;
};

export async function installMockGameRuntime(page: Page, options: InstallOptions = {}) {
  const seed = cloneMockTwineGameSeed(options.seed ?? baselineMockTwineGameSeed);
  await page.addInitScript(
    ({ seed }) => {
      type RuntimePath = Array<string | number>;
      type RuntimeContainer = Record<string, unknown> | Array<unknown>;
      type RuntimeWindow = Window & {
        SugarCube: unknown;
        TwineDugger: unknown;
        chrome: unknown;
      };

      const runtimeWindow = window as unknown as RuntimeWindow;
      const game = structuredClone(seed);
      let lockedPaths: RuntimePath[] = [];
      let pendingDiffs: unknown[] = [];
      let locksUpdated = false;

      const pathEquals = (a: RuntimePath, b: RuntimePath) => {
        if (a.length !== b.length) return false;
        return a.every((value, index) => value === b[index]);
      };

      const getParentContainer = (
        root: Record<string, unknown>,
        path: RuntimePath,
        createMissing: boolean,
      ): RuntimeContainer | null => {
        let current: unknown = root;
        for (const segment of path) {
          if (!current || typeof current !== 'object') return null;

          if (Array.isArray(current)) {
            const index = Number(segment);
            if (!Number.isInteger(index)) return null;
            if (typeof current[index] === 'undefined' && createMissing) current[index] = {};
            current = current[index];
            continue;
          }

          const currentObject = current as Record<string, unknown>;
          const key = String(segment);
          if (typeof currentObject[key] === 'undefined' && createMissing) currentObject[key] = {};
          current = currentObject[key];
        }
        if (!current || typeof current !== 'object') return null;
        return current as RuntimeContainer;
      };

      const version = game.meta.format?.version;
      runtimeWindow.SugarCube = {
        Config: {
          passages: {
            start: game.meta.passages?.start ?? game.initialPassage,
          },
          history: {
            controls: game.meta.settings?.historyControls ?? true,
            maxStates: game.meta.settings?.historyMax ?? 100,
          },
          saves: {
            maxSlotSaves: game.meta.save?.numSlots,
          },
        },
        Save: {
          browser: {
            slot: {
              size: game.meta.save?.slotsUsed,
            },
          },
          slots: {
            length: game.meta.save?.numSlots ?? 0,
            count: () => game.meta.save?.slotsUsed ?? 0,
          },
        },
        State: {
          variables: game.state,
          passage: game.initialPassage,
        },
        Story: {
          name: game.meta.name,
          title: game.meta.name,
          get ifId() {
            return game.meta.ifId;
          },
        },
        storage: {
          name: game.meta.save?.storage ?? 'localStorage',
        },
        version: {
          major: version?.major ?? 2,
          minor: version?.minor ?? 0,
          patch: version?.patch ?? 0,
          build: 0,
          long: () => `SugarCube v${version?.shortStr ?? '2.0.0'}`,
          short: () => version?.shortStr ?? '2.0.0',
          toString: () => version?.shortStr ?? '2.0.0',
        },
      };

      runtimeWindow.TwineDugger = {
        getPassageData: () => game.passages,
        getUpdates: () => {
          const diffs = pendingDiffs;
          pendingDiffs = [];

          const locksUpdate = locksUpdated ? lockedPaths.map((path) => [...path]) : null;
          locksUpdated = false;

          return {
            diffPackage: diffs.length
              ? {
                  passage: (runtimeWindow.SugarCube as { State: { passage: string } }).State
                    .passage,
                  diffs,
                }
              : null,
            locksUpdate,
          };
        },
        getState: () => ({
          passage: (runtimeWindow.SugarCube as { State: { passage: string } }).State.passage,
          state: game.state,
        }),
        setState: (path: RuntimePath, value: unknown) => {
          if (!path.length || typeof value === 'undefined') return;
          const parent = getParentContainer(game.state, path.slice(0, -1), true);
          if (!parent) return;
          const key = path[path.length - 1];

          let oldValue: unknown;
          if (Array.isArray(parent)) {
            const index = Number(key);
            if (!Number.isInteger(index)) return;
            oldValue = parent[index];
            if (Number.isInteger(index)) parent[index] = value;
          } else {
            oldValue = parent[String(key)];
            parent[String(key)] = value;
          }

          if (typeof oldValue === 'undefined') {
            pendingDiffs.push({
              type: 'object',
              subtype: 'add',
              path: path.slice(0, -1),
              key,
              newValue: value,
            });
            return;
          }

          if (typeof oldValue === 'boolean' && typeof value === 'boolean') {
            pendingDiffs.push({
              type: 'boolean',
              path: [...path],
              oldValue,
              newValue: value,
            });
            return;
          }

          if (typeof oldValue === 'number' && typeof value === 'number') {
            pendingDiffs.push({
              type: 'number',
              path: [...path],
              oldValue,
              newValue: value,
            });
            return;
          }

          if (typeof oldValue === 'string' && typeof value === 'string') {
            pendingDiffs.push({
              type: 'string',
              path: [...path],
              oldValue,
              newValue: value,
            });
            return;
          }

          pendingDiffs.push({
            type: 'type-changed',
            path: [...path],
            oldValue,
            newValue: value,
          });
        },
        deleteFromState: (path: RuntimePath) => {
          if (!path.length) return;
          const parent = getParentContainer(game.state, path.slice(0, -1), false);
          if (!parent) return;
          const key = path[path.length - 1];
          if (Array.isArray(parent)) {
            const index = Number(key);
            if (!Number.isInteger(index)) return;
            if (index < 0 || index >= parent.length) return;
            if (Number.isInteger(index)) parent.splice(index, 1);
            pendingDiffs.push({
              type: 'array',
              subtype: 'instructions',
              path: path.slice(0, -1),
              instructions: [{ type: 'remove', index }],
            });
            return;
          }
          const oldValue = parent[String(key)];
          if (typeof oldValue === 'undefined') return;
          delete parent[String(key)];
          pendingDiffs.push({
            type: 'object',
            subtype: 'remove',
            path: path.slice(0, -1),
            key,
            oldValue,
          });
        },
        duplicateStateProperty: (
          parentPath: RuntimePath,
          sourceKey: string | number,
          targetKey?: string | null,
        ) => {
          const parent = getParentContainer(game.state, parentPath, false);
          if (!parent) return;

          if (Array.isArray(parent)) {
            parent.push(structuredClone(parent[Number(sourceKey)]));
            return;
          }

          const source = String(sourceKey);
          const target = targetKey ?? `${source}_copy`;
          parent[target] = structuredClone(parent[source]);
          pendingDiffs.push({
            type: 'object',
            subtype: 'add',
            path: parentPath,
            key: target,
            newValue: structuredClone(parent[source]),
          });
        },
        setStatePropertyLock: (path: RuntimePath, lock: boolean) => {
          const normalizedPath = [...path];
          const existing = lockedPaths.findIndex((item) => pathEquals(item, normalizedPath));
          if (lock && existing === -1) lockedPaths = [...lockedPaths, normalizedPath];
          if (!lock && existing !== -1)
            lockedPaths = lockedPaths.filter((_, index) => index !== existing);
          locksUpdated = true;
          return lockedPaths.map((item) => [...item]);
        },
        setStatePropertyLocks: (paths: RuntimePath[]) => {
          lockedPaths = paths.map((path) => [...path]);
          locksUpdated = true;
        },
        utils: {
          jsonReplacer: (_key: string, value: unknown) => value,
          jsonReviver: (_key: string, value: unknown) => value,
        },
      };

      runtimeWindow.chrome = {
        devtools: {
          inspectedWindow: {
            tabId: 1,
          },
        },
        scripting: {
          executeScript: async (options: {
            func?: (...args: unknown[]) => unknown;
            args?: unknown[];
          }) => {
            if (typeof options.func === 'function') {
              const args = Array.isArray(options.args) ? options.args : [];
              const result = options.func(...args);
              return [{ result }];
            }
            return [{ result: undefined }];
          },
        },
      };
    },
    { seed },
  );
}
