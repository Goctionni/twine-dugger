import type { TypedText } from './type-ahead-context';

interface Props {
  typed: TypedText;
}

/** What has been typed, over the middle of the navigator. The nearest positioned parent is the room it has */
export function TypeAheadLabel(props: Props) {
  return (
    <div
      aria-hidden="true"
      class={[
        'pointer-events-none absolute top-1/2 left-1/2 z-10 max-w-4/5 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[10px] border-2 bg-slate-900 px-[18px] py-2 font-mono text-[20px] font-semibold tracking-[0.02em] text-ellipsis whitespace-pre shadow-[0_6px_24px] shadow-black/80 [font-variant-ligatures:none]',
        props.typed.isMiss ? 'border-red-400 text-red-400' : 'border-sky-500 text-gray-100',
      ]}
    >
      {props.typed.text}
    </div>
  );
}
