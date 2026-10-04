import { createSignal, createStore } from 'solid-js';

export type Section = 'state' | 'passage';
export interface SelectedHit {
  section: Section;
  key: string | number;
}

const flagKey = (section: Section, key: string | number) => `${section}:${key}`;

/**
 * Which result is open in the detail pane. A row asks `isSelected`, which only changes for the row
 * that was selected and the row that is now, so selecting does not touch the other rows.
 */
export function createSelection() {
  const [selected, setSelected] = createSignal<SelectedHit | null>(null);
  const [flags, setFlags] = createStore<Record<string, boolean>>({});

  const select = (hit: SelectedHit | null) => {
    const previous = selected();
    setFlags((draft) => {
      if (previous) draft[flagKey(previous.section, previous.key)] = false;
      if (hit) draft[flagKey(hit.section, hit.key)] = true;
    });
    setSelected(hit);
  };

  return {
    selected,
    select,
    isSelected: (section: Section, key: string | number) => !!flags[flagKey(section, key)],
  };
}
export type Selection = ReturnType<typeof createSelection>;
