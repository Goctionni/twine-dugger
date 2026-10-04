import { createMemo, Match, Show, Switch } from 'solid-js';

import { useSearch } from '../../model/context';
import { PassageDetail } from './PassageDetail';
import { StateDetail } from './StateDetail';

interface Props {
  /** A column beside the results, or a sheet over them */
  mode: 'column' | 'sheet';
}

/** The selected result. When there is none: a column says so, and a sheet isn't there at all */
export function DetailPane(props: Props) {
  const { selection, getPassage, stateOrder } = useSearch();

  const passage = createMemo(() => {
    const current = selection.selected();
    return current?.section === 'passage' ? getPassage(current.key as number) : undefined;
  });
  const stateHit = createMemo(() => {
    const current = selection.selected();
    return current?.section === 'state'
      ? stateOrder().find((hit) => hit.key === current.key)
      : undefined;
  });
  const hasDetail = () => !!(passage() ?? stateHit());

  return (
    <aside
      class={
        props.mode === 'column'
          ? 'flex h-full w-[40%] max-w-[44rem] min-w-80 shrink-0 flex-col border-l border-slate-700'
          : 'absolute inset-0 z-20 flex flex-col bg-slate-900'
      }
      hidden={props.mode === 'sheet' && !hasDetail()}
    >
      {/* A column is closed by clicking the selected result again; a sheet covers the results, so it has a bar */}
      <Show when={props.mode === 'sheet'}>
        <div class="flex items-center justify-end border-b border-slate-700 px-2 py-1">
          <button
            type="button"
            class="cursor-pointer rounded-sm px-2 py-0.5 text-sm hover:bg-slate-700"
            onClick={() => selection.select(null)}
          >
            ✕ Close
          </button>
        </div>
      </Show>
      <div class="min-h-0 flex-1 overflow-auto">
        <Switch fallback={<p class="p-3 text-sm text-slate-400">Select a result to preview it</p>}>
          {/* Matched on the id: saving a passage makes a new object, which must not replace the editor; another passage does */}
          <Match when={passage()?.id} keyed>
            {() => <PassageDetail passage={passage()!} />}
          </Match>
          <Match when={stateHit()?.key} keyed>
            {() => <StateDetail hit={stateHit()!} />}
          </Match>
        </Switch>
      </div>
    </aside>
  );
}
