import type { JSX } from '@solidjs/web';

interface Props {
  children: JSX.Element;
}

/**
 * The shortcuts of a field, under it while it has the focus. For a parent that is `group relative`.
 * It floats, so nothing moves, and has a box of its own to stay readable over what is behind it.
 */
export function KeyHint(props: Props) {
  return (
    <p class="pointer-events-none absolute top-full left-0 z-30 mt-1 hidden w-max max-w-full rounded-md border border-gray-600 bg-gray-950 px-2 py-0.5 text-[11px] text-gray-400 shadow-lg shadow-black/60 group-focus-within:block">
      {props.children}
    </p>
  );
}
