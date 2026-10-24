import type { JSX } from '@solidjs/web';

import { getTypeLetters } from '@/devtools-panel/ui/display/TypeIcon';
import type { ValueType } from '@/shared/shared-types';

interface Props {
  type: ValueType | 'up';
  isContainer: boolean;
  children?: JSX.Element;
}

/** A folder for a container, a page for a value */
export function TileIcon(props: Props) {
  const getLetters = () => (props.type === 'up' ? '↑' : getTypeLetters(props.type));

  return (
    <div
      class={[
        'relative grid place-items-center font-mono text-lg font-bold',
        getTypeClasses(props.type, props.isContainer),
        props.isContainer
          ? "mt-2 h-10 w-14 rounded-[4px_7px_7px_7px] text-gray-950 before:absolute before:-top-[7px] before:left-0 before:h-[9px] before:w-[22px] before:rounded-[4px_6px_0_0] before:content-['']"
          : "mt-0.5 h-12 w-[38px] rounded-[3px_12px_3px_3px] border-2 bg-[#16233a] after:absolute after:-top-0.5 after:-right-0.5 after:size-[11px] after:rounded-bl-[3px] after:border-b-2 after:border-l-2 after:bg-gray-900 after:content-['']",
      ]}
    >
      <span
        aria-hidden="true"
        class={props.type === 'other' ? 'material-symbols-outlined leading-none' : undefined}
      >
        {props.type === 'other' ? 'asterisk' : getLetters()}
      </span>
      {props.children}
    </div>
  );
}

/**
 * The classes of the icon of a type that depend on the type: its color, on the shape that it has (a
 * folder is filled with it, a page is drawn in it). Written out in full: Tailwind finds classes by
 * reading them. `up` is the tile that goes up.
 */
function getTypeClasses(type: ValueType | 'up', isContainer: boolean) {
  if (type === 'up') {
    if (isContainer) return 'bg-gray-500 before:bg-gray-500';
    return 'border-gray-500 text-gray-500 after:border-gray-500';
  }
  if (type === 'function') {
    if (isContainer) return 'bg-purple-500 before:bg-purple-500';
    return 'border-purple-500 text-purple-500 after:border-purple-500';
  }
  if (type === 'array') {
    if (isContainer) return 'bg-sky-500 before:bg-sky-500';
    return 'border-sky-500 text-sky-500 after:border-sky-500';
  }
  if (type === 'set') {
    if (isContainer) return 'bg-green-500 before:bg-green-500';
    return 'border-green-500 text-green-500 after:border-green-500';
  }
  if (type === 'map') {
    if (isContainer) return 'bg-teal-500 before:bg-teal-500';
    return 'border-teal-500 text-teal-500 after:border-teal-500';
  }
  if (type === 'object') {
    if (isContainer) return 'bg-blue-500 before:bg-blue-500';
    return 'border-blue-500 text-blue-500 after:border-blue-500';
  }
  if (type === 'date') {
    if (isContainer) return 'bg-orange-500 before:bg-orange-500';
    return 'border-orange-500 text-orange-500 after:border-orange-500';
  }
  if (type === 'string') {
    if (isContainer) return 'bg-yellow-400 before:bg-yellow-400';
    return 'border-yellow-400 text-yellow-400 after:border-yellow-400';
  }
  if (type === 'number') {
    if (isContainer) return 'bg-red-500 before:bg-red-500';
    return 'border-red-500 text-red-500 after:border-red-500';
  }
  if (type === 'NaN') {
    if (isContainer) return 'bg-red-400 before:bg-red-400';
    return 'border-red-400 text-red-400 after:border-red-400';
  }
  if (type === 'infinity') {
    if (isContainer) return 'bg-red-400 before:bg-red-400';
    return 'border-red-400 text-red-400 after:border-red-400';
  }
  if (type === 'boolean') {
    if (isContainer) return 'bg-gray-200 before:bg-gray-200';
    return 'border-gray-200 text-gray-200 after:border-gray-200';
  }
  if (type === 'null') {
    if (isContainer) return 'bg-slate-400 before:bg-slate-400';
    return 'border-slate-400 text-slate-400 after:border-slate-400';
  }
  if (type === 'undefined') {
    if (isContainer) return 'bg-gray-400 before:bg-gray-400';
    return 'border-gray-400 text-gray-400 after:border-gray-400';
  }
  // other
  if (isContainer) return 'bg-fuchsia-500 before:bg-fuchsia-500';
  return 'border-fuchsia-500 text-fuchsia-500 after:border-fuchsia-500';
}
