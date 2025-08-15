import { createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';

import { PassageData } from '@/shared/shared-types';

export interface ParsedPassageData {
  id: number;
  name: string;
  size: [number, number] | null;
  position: [number, number] | null;
  content: string;
  tags: string[];
}

interface Store {
  selectedPassage: ParsedPassageData | null;
}

const [store, setStore] = createStore<Store>({ selectedPassage: null });

export const getSelectedPassage = createMemo(() => store.selectedPassage);
export const setSelectedPassage = (passage: ParsedPassageData | null) =>
  setStore({ selectedPassage: passage });

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
