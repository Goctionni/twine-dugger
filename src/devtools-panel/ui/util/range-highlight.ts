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
 * DOM ranges for positions in the text inside `root`, counted over all its text nodes, however the
 * text is cut up into elements. Positions outside the text are left out.
 */
export function createTextRanges(root: Node, positions: readonly CharRange[]): Range[] {
  const nodes: Array<{ node: Text; start: number }> = [];
  let length = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, start: length });
    length += node.nodeValue?.length ?? 0;
  }

  /** The last text node that starts before the position (the end of a range may be at a node's end) */
  const locate = (position: number, isEnd: boolean) => {
    let low = 0;
    let high = nodes.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      const { start } = nodes[middle]!;
      if (isEnd ? start < position : start <= position) low = middle;
      else high = middle - 1;
    }
    const found = nodes[low];
    if (!found) return undefined;
    const offset = position - found.start;
    return offset >= 0 && offset <= found.node.length ? { node: found.node, offset } : undefined;
  };

  const ranges: Range[] = [];
  for (const [from, to] of positions) {
    const start = locate(from, false);
    const end = locate(to, true);
    if (!start || !end || to > length) continue;
    const range = new Range();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    ranges.push(range);
  }
  return ranges;
}

/**
 * Marks characters of the text inside `root` as a search match, without changing the page.
 * Returns what takes the marks away again.
 */
export function highlightRanges(root: Node, positions: readonly CharRange[]): () => void {
  if (!isSupported() || !positions.length) return () => {};
  const highlight = getHighlight();
  const ranges = createTextRanges(root, positions);
  ranges.forEach((range) => highlight.add(range));
  return () => ranges.forEach((range) => highlight.delete(range));
}
