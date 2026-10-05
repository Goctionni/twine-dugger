import clsx from 'clsx';
import type { Accessor } from 'solid-js';

import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';

import type { StateHit } from '../../core/types';
import { useSearch } from '../../model/context';
import { Highlight } from './Highlight';

/** A long text is cut: a row shows one line and the detail has the rest */
const MAX_TEXT = 300;

interface Props {
  hit: Accessor<StateHit>;
}

export function StateRow(props: Props) {
  const { selection } = useSearch();
  const valueText = () => {
    const { value } = props.hit();
    return value === undefined ? '' : String(value).slice(0, MAX_TEXT);
  };
  const quote = () => (props.hit().type === 'string' ? '"' : '');

  // Clicking the selected result again closes it
  const toggleSelected = (key: string) =>
    selection.select(selection.isSelected('state', key) ? null : { section: 'state', key });

  return (
    <button
      type="button"
      class={clsx(
        'flex h-full w-full cursor-pointer items-center gap-2 border-t border-slate-700 px-3 text-left font-mono text-sm hover:bg-slate-700',
        selection.isSelected('state', props.hit().key) && 'bg-sky-900 shadow-[inset_2px_0_#38bdf8]',
      )}
      onClick={() => toggleSelected(props.hit().key)}
    >
      <TypeIcon type={props.hit().type} />
      <span class="max-w-[60%] min-w-0 shrink-0 truncate" title={props.hit().pathText}>
        <PrettyPath path={props.hit().path} ranges={props.hit().pathMatch} />
      </span>
      <span class="min-w-0 flex-1 truncate text-orange-200">
        {quote()}
        <Highlight text={valueText()} ranges={props.hit().valueMatch} />
        {quote()}
      </span>
    </button>
  );
}
