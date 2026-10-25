import type { JSX } from '@solidjs/web';

export type TileSelectionState = 'selected' | 'normal';

interface Props {
  id: string;
  selectionState: TileSelectionState;
  title?: string;
  onClick: () => void;
  children: JSX.Element;
}

/** What a tile and the tile that goes up have in common */
export function TileFrame(props: Props) {
  return (
    <div
      id={props.id}
      role="option"
      aria-selected={props.selectionState === 'selected' ? 'true' : 'false'}
      data-selection-state={props.selectionState}
      title={props.title}
      onClick={() => props.onClick()}
      class={[
        'relative flex h-[calc(88.5px+1.875rem)] min-w-0 cursor-pointer flex-col items-center gap-[3px] rounded-lg border px-1 pt-2 pb-1.5 text-center select-none',
        props.selectionState === 'selected' && 'border-sky-500 bg-sky-950',
        props.selectionState === 'normal' && 'border-transparent hover:bg-gray-800',
      ]}
    >
      {props.children}
    </div>
  );
}
