import type { Accessor, JSX } from 'solid-js';
import { createMemo, createSignal, onCleanup } from 'solid-js';

import type {
  Placement,
  PlacementFlip,
  PlacementOrFallback,
  TooltipConfig,
  TooltipValue,
} from '@/shared/shared-types';

import { useSetTooltip } from './TooltipOutlet';

type FullConfig = Required<TooltipConfig>;

type XY = { x: number; y: number };
type WH = { w: number; h: number };
type XYWH = XY & WH;

const defaultConfig: FullConfig = {
  anchor: 'cursor',
  placement: ['bottom', 'right', 'bottom right', 'top', 'left', 'top left'],
  offset: 4,
};

export function tooltip(el: HTMLElement, accessor: Accessor<TooltipValue>) {
  const setTooltip = useSetTooltip();

  const [anchorX, setAnchorX] = createSignal(0);
  const [anchorY, setAnchorY] = createSignal(0);
  const [anchorWH, setAnchorWH] = createSignal<WH>({ w: 0, h: 0 });
  const [tooltipWH, setTooltipWH] = createSignal<WH | null>(null);

  const contentAndConfig = createMemo(() => {
    const value = accessor();
    return (Array.isArray(value) ? value : [value, defaultConfig]) as [JSX.Element, TooltipConfig];
  });

  const content = () => contentAndConfig()[0];

  const config = createMemo<FullConfig>(
    () => ({ ...defaultConfig, ...contentAndConfig()[1] }),
    defaultConfig,
    {
      equals: (prev, next) =>
        Object.entries(prev).every(([key, value]) => value === next[key as keyof FullConfig]),
    },
  );

  const translate = createMemo((): string => {
    const _config = config();
    const placementArray = getPlacementArray(_config.placement);
    const base = placementArray[0];
    const maxX = window.innerWidth;
    const maxY = window.innerHeight;
    const anchor: XYWH = {
      x: anchorX(),
      y: anchorY(),
      ...anchorWH(),
    };
    const tooltip = tooltipWH() ?? { w: 0, h: 0 };

    for (const p of placementArray) {
      const [p1, p2] = getXY(base, p, _config.offset, anchor, tooltip);
      if (p1.x >= 0 && p1.y >= 0 && p2.x <= maxX && p2.y <= maxY) {
        return `${p1.x}px ${p1.y}px`;
      }
    }
    const [p1] = getXY(base, base, _config.offset, anchor, tooltip);
    return `${p1.x}px ${p1.y}px`;
  });

  const style = createMemo((): JSX.CSSProperties => {
    if (tooltipWH() !== null) return { translate: translate(), left: 0, top: 0 };

    return { 'left': 0, 'top': 0, 'opacity': 0, 'pointer-events': 'none' };
  });

  const setTooltipSize = (el: HTMLDivElement) => {
    requestAnimationFrame(() => setTooltipWH({ w: el.clientWidth, h: el.clientHeight }));
    requestAnimationFrame(() => console.log('el', el, el.parentElement));
  };

  const onMouseEnter = (e: MouseEvent) => {
    const anchor = config().anchor;
    if (anchor === 'cursor') {
      setAnchorX(e.clientX);
      setAnchorY(e.clientY);
      setAnchorWH({ w: 30, h: 30 });
    }
    if (anchor === 'element') {
      const rect = el.getBoundingClientRect();
      setAnchorX(rect.left);
      setAnchorY(rect.top);
      setAnchorWH({ w: el.clientWidth, h: el.clientHeight });
    }

    setTooltipWH(null);

    setTooltip?.(
      <div
        ref={setTooltipSize}
        class="fixed z-50 rounded bg-gray-900/95 px-2 py-1 text-sm text-white outline -outline-offset-1 outline-gray-100/50"
        style={style()}
      >
        {content()}
      </div>,
    );
  };

  const onMouseLeave = () => setTooltip?.(null);

  const onMouseMove = (e: MouseEvent) => {
    const anchor = config().anchor;
    if (anchor === 'cursor') {
      setAnchorX(e.clientX);
      setAnchorY(e.clientY);
    }
  };

  // Bind baseline listener events
  el.addEventListener('mouseenter', onMouseEnter);
  el.addEventListener('mouseleave', onMouseLeave);
  el.addEventListener('mousemove', onMouseMove);

  onCleanup(() => {
    el.removeEventListener('mouseenter', onMouseEnter);
    el.removeEventListener('mouseleave', onMouseLeave);
    el.removeEventListener('mousemove', onMouseMove);
    setTooltip?.(null);
  });
}

const getPlacementArray = (placement: FullConfig['placement']) => {
  return Array.isArray(placement) ? placement : [placement];
};

const isFlip = (value: PlacementOrFallback): value is PlacementFlip => {
  return value === 'flip-block' || value === 'flip-inline' || value === 'flip-both';
};

const getFlipMultiX = (flip: PlacementOrFallback) => {
  if (isFlip(flip) && flip !== 'flip-block') return -1;
  return 1;
};
const getFlipMultiY = (flip: PlacementOrFallback) => {
  if (isFlip(flip) && flip !== 'flip-inline') return -1;
  return 1;
};

const offsetXMulti = (p: Placement) => {
  if (p.includes('left')) return -1;
  if (p.includes('right')) return 1;
  return 0;
};

const offsetYMulti = (p: Placement) => {
  if (p.includes('top')) return -1;
  if (p.includes('bottom')) return 1;
  return 0;
};

const offsetX = (
  xMulti: number,
  configOffset: number,
  anchorWidth: number,
  tooltipWidth: number,
) => {
  if (xMulti < 0) return (configOffset + tooltipWidth) * xMulti;
  if (xMulti > 0) return configOffset + anchorWidth;
  return anchorWidth / 2 - tooltipWidth / 2;
};

const offsetY = (
  yMulti: number,
  configOffset: number,
  anchorHeight: number,
  tooltipHeight: number,
) => {
  if (yMulti < 0) return (configOffset + tooltipHeight) * yMulti;
  if (yMulti > 0) return (configOffset + anchorHeight) * yMulti;
  return anchorHeight / 2 - tooltipHeight / 2;
};

const getXY = (
  basePlacement: Placement,
  placement: PlacementOrFallback,
  configOffset: number,
  anchor: XYWH,
  tooltip: WH,
): [XY, XY] => {
  const _multiX = isFlip(placement)
    ? offsetXMulti(basePlacement) * getFlipMultiX(placement)
    : offsetXMulti(placement);
  const _multiY = isFlip(placement)
    ? offsetYMulti(basePlacement) * getFlipMultiY(placement)
    : offsetYMulti(placement);

  const targetX1 = anchor.x + offsetX(_multiX, configOffset, anchor.w, tooltip.w);
  const targetY1 = anchor.y + offsetY(_multiY, configOffset, anchor.h, tooltip.h);
  const targetX2 = targetX1 + tooltip.w;
  const targetY2 = targetY1 + tooltip.h;

  return [
    { x: targetX1, y: targetY1 },
    { x: targetX2, y: targetY2 },
  ];
};
