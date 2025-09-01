import type { JSX } from 'solid-js';

type AnchorRenderProps = {
  'class': string;
  'data-anchor': string;
  'tabIndex'?: number;
};

type Props = {
  element: (p: AnchorRenderProps) => JSX.Element;
  tooltip: JSX.Element;
  area?: string;
};

export function Tooltip(props: Props) {
  const id = `--a-${crypto.randomUUID()}`;

  return (
    <>
      {props.element({ 'class': 'tp-anchor', 'data-anchor': id, 'tabIndex': 0 })}
      <div class="tp-tooltip p-2" data-anchor-target={id} data-area={props.area} role="tooltip">
        <div
          class="
          tp-tooltip-inner
          rounded px-2 py-1 text-sm text-white bg-gray-900/95 outline -outline-offset-1 outline-gray-100/50
        "
        >
          {props.tooltip}
        </div>
      </div>
    </>
  );
}
