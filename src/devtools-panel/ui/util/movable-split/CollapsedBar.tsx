import { Show } from 'solid-js';

import type { SplitOrientation } from './createLiveOrientation';

export type Side = 'first' | 'second';

interface Props {
  orientation: SplitOrientation;
  side: Side;
  label?: string;
  onPointerDown: (e: PointerEvent) => void;
  onClick: () => void;
}

export function CollapsedBar(props: Props) {
  const isVertical = () => props.orientation === 'vertical';
  // Points to where the panel will open
  const getArrow = () => {
    if (isVertical()) return props.side === 'first' ? '⌄' : '⌃';
    return props.side === 'first' ? '»' : '«';
  };

  return (
    <button
      type="button"
      class={[
        'flex shrink-0 cursor-pointer touch-none items-center gap-2 bg-gray-700 text-gray-200 hover:bg-sky-700',
        isVertical() ? 'h-7 flex-row px-3' : 'w-7 flex-col py-3',
      ]}
      title={props.label ? `Show ${props.label}` : 'Show'}
      onPointerDown={(e) => props.onPointerDown(e)}
      onClick={() => props.onClick()}
    >
      <span aria-hidden="true">{getArrow()}</span>
      <Show when={props.label}>
        <span class={[!isVertical() && '[writing-mode:vertical-rl]', 'text-sm whitespace-nowrap']}>
          {props.label}
        </span>
      </Show>
    </button>
  );
}
