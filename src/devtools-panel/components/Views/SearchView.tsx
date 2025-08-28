import { createMemo, For, JSX, Show } from 'solid-js';

import { ContainerValue, ObjectValue, Path, Value } from '@/shared/shared-types';
import { isPrimitive } from '@/shared/type-helpers';

import {
  createGetViewState,
  getLatestStateFrame,
  getPassageData,
  setViewState,
} from '../../store/store';
import { StringInput } from '../Common/Inputs/StringInput';
import { navItems, setNavItem } from '../Layout/nav-items';
import { ParsedPassageData, setSelectedPassage } from './passageDataStore';
import { ListItem as PassageListItem } from './PassagesView';

export function SearchView() {
  const getQuery = createGetViewState('search', 'query');
  const setQuery = (value: string) => setViewState('search', 'query', value);

  const searchResults = createMemo(() => {
    if (!getQuery()) return { state: [] };
    const gameState = getLatestStateFrame();
    if (!gameState) return { state: [] };
    return {
      state: findStateMatches(gameState.state, getQuery()),
      passage: findPassageMatches(getPassageData(), getQuery()),
    };
  });
  const onPathClick = (path: Path) => {
    setNavItem(navItems[0]);
    setViewState('state', 'path', path);
  };
  const onPassageClick = (passage: ParsedPassageData) => {
    setNavItem(navItems[2]);
    setSelectedPassage(passage);
  };

  return (
    <div class="px-4 py-2 w-full h-full flex flex-col overflow-hidden">
      <h1 class="font-bold text-xl pb-2">Search</h1>
      <StringInput
        value={getQuery()}
        onChange={setQuery}
        placeholder="Search..."
        autoFocus
        class="max-w-[200px]"
      />
      <Show when={Object.values(searchResults()).some((arr) => arr.length > 0)}>
        <div class="flex-1 overflow-hidden">
          <div class="w-full h-full flex gap-2 overflow-hidden">
            <div class="h-full flex-1 overflow-hidden flex flex-col">
              <h1 class="font-bold text-base pt-4 pb-2">State Results</h1>
              <ul class="h-full overflow-auto flex-1">
                <For each={searchResults().state}>
                  {(result) => (
                    <li class="border-t border-slate-400 last:border-b flex">
                      <button
                        type="button"
                        class="px-4 py-2 font-mono cursor-pointer hover:bg-slate-600 flex-1 text-left"
                        onClick={() => onPathClick(result)}
                      >
                        <NicePath path={result} />
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </div>
            <div class="h-full flex-1 overflow-hidden flex flex-col">
              <h1 class="font-bold text-base pt-4 pb-2">Passage Results</h1>
              <ul class="h-full overflow-auto flex-1">
                <For each={searchResults().passage}>
                  {(result) => (
                    <PassageListItem passageData={result} onClick={() => onPassageClick(result)} />
                  )}
                </For>
              </ul>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

interface NicePathProps {
  path: Path;
}

function NicePath(props: NicePathProps) {
  const parts = createMemo(() => {
    const uiParts: JSX.Element[] = [];
    let parentObject: ContainerValue = getLatestStateFrame()?.state ?? {};
    for (let i = 0; i < props.path.length; i++) {
      const part = props.path[i]!;
      if (Array.isArray(parentObject)) {
        uiParts.push(`[${part}]`);
      } else if (parentObject instanceof Map) {
        uiParts.push(`.get('${part}')`);
      } else {
        if (i === 0) uiParts.push(part);
        else if (typeof part === 'number') uiParts.push(`[${part}]`);
        else {
          if (part.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/)) uiParts.push(`.${part}`);
          else uiParts.push(`['${part}']`);
        }
      }
    }
    return uiParts;
  });
  return <>{parts()}</>;
}

function findPassageMatches(data: ParsedPassageData[], rawQuery: string): ParsedPassageData[] {
  const query = rawQuery.toLowerCase();
  const results: ParsedPassageData[] = [];
  // search name
  for (const passage of data) {
    if (passage.name.toLocaleLowerCase().includes(query)) results.push(passage);
  }
  // search tags
  for (const passage of data) {
    if (results.includes(passage)) continue;
    if (passage.tags?.some((tag) => tag.toLocaleLowerCase().includes(query))) {
      results.push(passage);
    }
  }
  // search content
  for (const passage of data) {
    if (results.includes(passage)) continue;
    if (passage.content.toLocaleLowerCase().includes(query)) results.push(passage);
  }
  return results;
}

function findStateMatches(data: ObjectValue, rawQuery: string): Path[] {
  const fullMatches: Path[] = [];
  const partialMatches: Path[] = [];

  const query = rawQuery.toLowerCase();
  const qNum = (() => {
    const n = Number(rawQuery.trim());
    return Number.isFinite(n) ? n : undefined;
  })();

  const seen = new WeakSet<object>();

  function visit(val: Value, path: Path) {
    if (val && typeof val === 'object') {
      if (seen.has(val as object)) return;
      seen.add(val as object);

      if (Array.isArray(val)) {
        val.forEach((v, i) => {
          checkValue(v, i, path);
          visit(v, [...path, i]);
        });
        return;
      }

      if (val instanceof Map) {
        for (const [k, v] of val.entries()) {
          checkKey(`${k}`, path);
          checkValue(v, k, path);
          visit(v, [...path, k]);
        }
        return;
      }

      if (val instanceof Set) {
        let i = 0;
        for (const v of val) {
          checkValue(v, i, path);
          visit(v, [...path, i]);
          i++;
        }
        return;
      }

      const obj = val as { [k: string]: Value };
      for (const k of Object.keys(obj)) {
        checkKey(k, path);
        checkValue(obj[k], k, path);
        visit(obj[k], [...path, k]);
      }
    }
  }

  function checkKey(key: string, path: Path) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === query) {
      fullMatches.push([...path, key]);
    } else if (lowerKey.includes(query)) {
      partialMatches.push([...path, key]);
    }
  }

  function checkValue(v: Value, key: string | number, path: Path) {
    if (!isPrimitive(v)) return;

    if (typeof v === 'string') {
      const lowerVal = v.toLowerCase();
      if (lowerVal === query) {
        fullMatches.push([...path, key]);
      } else if (lowerVal.includes(query)) {
        partialMatches.push([...path, key]);
      }
    } else if (typeof v === 'number' && qNum !== undefined) {
      if (v === qNum) {
        fullMatches.push([...path, key]);
      } else if (String(v).includes(String(qNum))) {
        partialMatches.push([...path, key]);
      }
    }
  }

  visit(data, []);
  return dedupe([...fullMatches, ...partialMatches]);
}

function dedupe(paths: Path[]): Path[] {
  const seen = new Set<string>();
  const res: Path[] = [];
  for (const p of paths) {
    const key = JSON.stringify(p);
    if (!seen.has(key)) {
      seen.add(key);
      res.push(p);
    }
  }
  return res;
}
