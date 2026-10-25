import type { JSX } from '@solidjs/web';

interface Props {
  title: string;
  /** The longer explanation */
  children: JSX.Element;
}

/**
 * A small "i" button that opens a bubble under it. The bubble is a popover (it closes on a click
 * outside or Escape by itself) that is placed next to the button with anchor positioning.
 */
export function InfoBubble(props: Props) {
  const id = `info-${crypto.randomUUID()}`;

  return (
    <>
      <button
        type="button"
        aria-label={`About ${props.title}`}
        popovertarget={id}
        style={{ 'anchor-name': `--${id}` }}
        class="h-4.5 w-4.5 cursor-pointer rounded-full border border-gray-500 font-serif text-[11px] leading-4 font-semibold text-gray-400 italic hover:border-sky-400 hover:bg-sky-950 hover:text-sky-300"
      >
        i
      </button>
      <div
        id={id}
        popover
        style={{ '--anchor': `--${id}` }}
        class="fixed inset-auto m-1.5 max-w-[460px] rounded-lg border border-gray-500 bg-gray-800 px-3.5 pt-2.5 pb-3 text-[13px] text-gray-100 shadow-lg shadow-black/60 [position-anchor:var(--anchor)] [position-area:bottom_span-right] [position-try-fallbacks:flip-block,flip-inline]"
      >
        <h4 class="mb-1 font-semibold">{props.title}</h4>
        <div class="flex flex-col gap-1.5 text-gray-300">{props.children}</div>
      </div>
    </>
  );
}
