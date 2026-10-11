import clsx from 'clsx';

import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';

import type { StateMatcherHit } from '../types';
import { Highlight } from './Highlight';

/** A long text is cut: a row shows one line and the detail has the rest */
const MAX_TEXT = 300;

interface Props {
  hit: StateMatcherHit;
  isSelected: boolean;
  onClick: () => void;
}

export function StateRow(props: Props) {
  const valueText = () => {
    const { value } = props.hit;
    return value === undefined ? '' : String(value).slice(0, MAX_TEXT);
  };
  const quote = () => (props.hit.type === 'string' ? '"' : '');

  return (
    <button
      type="button"
      class={clsx(
        'flex h-full w-full cursor-pointer items-center gap-2 border-t border-slate-700 px-3 text-left font-mono text-sm hover:bg-slate-700',
        props.isSelected && 'bg-sky-900 shadow-[inset_2px_0_#38bdf8]',
      )}
      onClick={() => props.onClick()}
    >
      <TypeIcon type={props.hit.type} />
      <span class="max-w-[60%] min-w-0 shrink-0 truncate" title={props.hit.pathText}>
        <PrettyPath path={props.hit.path} ranges={props.hit.pathRanges} />
      </span>
      <span class="min-w-0 flex-1 truncate text-orange-200">
        {quote()}
        <Highlight text={valueText()} ranges={props.hit.valueRanges} />
        {quote()}
      </span>
    </button>
  );
}
