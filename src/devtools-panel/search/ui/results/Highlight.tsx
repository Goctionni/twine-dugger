import { createEffect } from 'solid-js';

import { highlightRanges, type CharRange } from '@/devtools-panel/ui/util/range-highlight';

interface Props {
  text: string;
  ranges: readonly CharRange[];
}

/** `text` with the `ranges` marked as search matches. The markup is only the text: marking is an overlay */
export function Highlight(props: Props) {
  let element: HTMLSpanElement | undefined;

  createEffect(
    () => ({ text: props.text, ranges: props.ranges.map(([start, end]) => [start, end] as const) }),
    ({ ranges }) => (element ? highlightRanges(element, ranges) : undefined),
  );

  return <span ref={element}>{props.text}</span>;
}
