import type { JSX } from '@solidjs/web';

interface Props {
  trigger: JSX.Element;
  label: string;
  triggerClass?: JSX.HTMLAttributes<HTMLButtonElement>['class'];
  menuClass?: JSX.HTMLAttributes<HTMLDivElement>['class'];
  align?: 'start' | 'end';
  children: (close: () => void) => JSX.Element;
}

export function Dropdown(props: Props) {
  let menu: HTMLDivElement | undefined;
  const id = `dropdown-${crypto.randomUUID()}`;

  return (
    <>
      <button
        type="button"
        popovertarget={id}
        class={props.triggerClass}
        aria-label={props.label}
        title={props.label}
      >
        {props.trigger}
      </button>
      <div
        ref={menu}
        id={id}
        popover
        class={[
          'inset-auto max-h-64 min-w-40 overflow-auto rounded-b-md border border-gray-700 bg-gray-800 p-1 text-gray-200 shadow-lg [position-try-fallbacks:flip-block,flip-inline]',
          props.align === 'end'
            ? '[position-area:bottom_span-left]'
            : '[position-area:bottom_span-right]',
          props.menuClass,
        ]}
      >
        {props.children(() => menu?.hidePopover())}
      </div>
    </>
  );
}
