import type { SplitOrientation } from './createLiveOrientation';
import { OrientationButton } from './OrientationButton';

interface Props {
  orientation: SplitOrientation;
  onStartDrag: (e: PointerEvent) => void;
  onChangeDirection: (shift: boolean) => void;
}

export function Divider(props: Props) {
  const isVertical = () => props.orientation === 'vertical';

  return (
    <div
      role="separator"
      aria-orientation={isVertical() ? 'horizontal' : 'vertical'}
      class={[
        'relative shrink-0 touch-none bg-gray-700 hover:bg-sky-600',
        isVertical() ? 'h-2 cursor-row-resize' : 'w-2 cursor-col-resize',
      ]}
      onPointerDown={(e) => props.onStartDrag(e)}
    >
      <OrientationButton orientation={props.orientation} onChange={props.onChangeDirection} />
    </div>
  );
}
