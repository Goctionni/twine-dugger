import { createSignal } from 'solid-js';

import type { ParsedPassageData, PassageData } from '@/shared/shared-types';

import { getPassageData as fetchPassageData, setPassage } from '../api/api';
import { store } from './store';

export const [getPassageData, setPassageData] = createSignal<ParsedPassageData[]>([]);

function parseDoubleIntAttr(str: string) {
  return str.split(',').map(Number) as [number, number];
}

export function parsePassage(passage: PassageData): ParsedPassageData {
  return {
    id: parseInt(passage.pid),
    name: passage.name,
    size: passage.size ? parseDoubleIntAttr(passage.size) : null,
    position: passage.position ? parseDoubleIntAttr(passage.position) : null,
    content: passage.content,
    tags: passage.tags?.split(' ').filter(Boolean),
  };
}

export const getSelectedPassage = () => {
  const name = store.viewState.passages.selected;
  if (name === null) return null;
  return getPassageData().find((passage) => passage.name === name) ?? null;
};

export const reloadPassagesData = async () => {
  const passageData = await fetchPassageData();
  setPassageData(passageData.map(parsePassage));
};

/** Writes the new content to the game, and to the passages that are known here */
export function savePassage(passage: ParsedPassageData, content: string) {
  setPassage({ name: passage.name, source: content });
  setPassageData((current) =>
    current.map((known) => (known.id === passage.id ? { ...known, content } : known)),
  );
}
