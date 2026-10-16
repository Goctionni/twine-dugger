import { tooltip } from '../../display/TooltipDirective';
import type { SplitOrientation } from './createLiveOrientation';

interface Props {
  orientation: SplitOrientation;
  onChange: (shift: boolean) => void;
}

export function OrientationButton(props: Props) {
  const isVertical = () => props.orientation === 'vertical';
  const getLabel = () =>
    `${isVertical() ? 'Place the panels side by side' : 'Stack the panels'} (Shift+click: auto)`;

  return (
    <button
      type="button"
      class={[
        'group absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center',
        isVertical() ? 'h-5 w-9' : 'h-9 w-5',
      ]}
      aria-label={getLabel()}
      ref={tooltip(getLabel)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => props.onChange(e.shiftKey)}
    >
      <span class="flex size-5 items-center justify-center rounded-full bg-gray-600 text-gray-200 outline outline-gray-900 group-hover:bg-sky-600">
        <span
          aria-hidden="true"
          class={[
            'material-symbols-outlined text-sm leading-none transition-transform duration-200',
            isVertical() ? 'rotate-90 group-hover:rotate-0' : 'rotate-0 group-hover:rotate-90',
          ]}
        >
          splitscreen_left
        </span>
      </span>
    </button>
  );
}
