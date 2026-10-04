import { SEARCH_MATCH_HIGHLIGHT } from './range-highlight';

// jsdom has no Custom Highlight API: this stands in for it, and keeps what is marked
class FakeHighlight extends Set<Range> {}

export function installFakeHighlights() {
  Object.assign(globalThis, { Highlight: FakeHighlight });
  Object.assign(globalThis.CSS ?? (globalThis.CSS = {} as typeof CSS), { highlights: new Map() });
}

/** The text of everything that is marked as a search match right now */
export const getMarkedText = () =>
  [
    ...((CSS.highlights.get(SEARCH_MATCH_HIGHLIGHT) as unknown as Set<Range> | undefined) ?? []),
  ].map((range) => range.toString());
