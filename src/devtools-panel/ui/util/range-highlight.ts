/** Half-open positions in a text */
export type CharRange = readonly [start: number, end: number];

/** The name to style with `::highlight(search-match)` */
export const SEARCH_MATCH_HIGHLIGHT = 'search-match';

// https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API
const isSupported = () =>
  typeof CSS !== 'undefined' && 'highlights' in CSS && 'Highlight' in globalThis;

function getHighlight() {
  let highlight = CSS.highlights.get(SEARCH_MATCH_HIGHLIGHT);
  if (!highlight) {
    highlight = new Highlight();
    CSS.highlights.set(SEARCH_MATCH_HIGHLIGHT, highlight);
  }
  return highlight;
}

/**
 * Marks characters of the text inside `root` as a search match, without changing the page: the
 * ranges are positions in the text of `root`, counted over all its text nodes, however the text is
 * cut up into elements. Returns what takes the marks away again.
 */
export function highlightRanges(root: Node, ranges: readonly CharRange[]): () => void {
  if (!isSupported() || !ranges.length) return () => {};

  const nodes: Array<{ node: Text; start: number }> = [];
  let length = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, start: length });
    length += node.nodeValue?.length ?? 0;
  }

  /** The text node a position is in; the end of a range may be at the very end of a node */
  const locate = (position: number, isEnd: boolean) =>
    nodes.find(({ node, start }) =>
      isEnd
        ? position > start && position <= start + node.length
        : position >= start && position < start + node.length,
    );

  const highlight = getHighlight();
  const made: Range[] = [];
  for (const [from, to] of ranges) {
    const first = locate(from, false);
    const last = locate(to, true);
    if (!first || !last) continue;
    const range = new Range();
    range.setStart(first.node, from - first.start);
    range.setEnd(last.node, to - last.start);
    highlight.add(range);
    made.push(range);
  }
  return () => made.forEach((range) => highlight.delete(range));
}
