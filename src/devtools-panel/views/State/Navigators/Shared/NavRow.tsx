import { Match, Show, Switch } from 'solid-js';

import { isPinned } from '@/devtools-panel/store/store';
import { highlight } from '@/devtools-panel/ui/display/HighlightDirective';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import type { Path } from '@/shared/shared-types';

import { createPathMenu } from '../../PathMenu/create-path-menu';
import { ChangedDot } from './ChangedDot';
import { ChildCount } from './ChildCount';
import { createNodeInfo } from './create-node-info';
import { getPreview } from './preview';
import { isRecentlyChanged } from './recently-changed';

interface Props {
  id: string;
  path: Path;
  isExpanded?: boolean;
  selectionState: 'selected' | 'on-path' | 'trail' | 'normal';
  onClick: () => void;
  class?: string;
}

/** Not a button: it is never focused. The tree has the focus, and tells which row is active */
export function NavRow(props: Props) {
  // The path of a row is a new array whenever it is worked out again
  const getPath = createStablePath(() => props.path);
  const getLevel = () => getPath().length;
  const onContextMenu = createPathMenu(getPath);
  const { getValue, getType, getName, getCounts, getNameRanges, getValueRanges } =
    createNodeInfo(getPath);
  // Only a container with something to show can be open
  const getIsOpen = () => {
    const counts = getCounts();
    return counts === undefined ? undefined : props.isExpanded === true && counts.shown > 0;
  };

  return (
    <div
      id={props.id}
      role="treeitem"
      aria-level={getLevel()}
      aria-selected={props.selectionState === 'selected' ? 'true' : 'false'}
      aria-expanded={getIsOpen() === undefined ? undefined : getIsOpen() ? 'true' : 'false'}
      data-selection-state={props.selectionState}
      class={[
        // The margin keeps a row that is scrolled into view from ending up under the sticky header of the column
        'flex w-full min-w-0 cursor-pointer scroll-mt-8 items-center gap-2 rounded-md border px-2 py-1 text-left text-sm select-none',
        props.selectionState === 'selected' && 'border-sky-500 bg-sky-950',
        props.selectionState === 'on-path' && 'border-transparent bg-slate-800',
        props.selectionState === 'trail' && 'border-dashed border-sky-500 bg-sky-950/40',
        props.selectionState === 'normal' && 'border-transparent hover:bg-gray-800',
        props.class,
      ]}
      onClick={() => props.onClick()}
      onContextMenu={onContextMenu}
    >
      <TypeIcon type={getType()} />
      <span class="max-w-[60%] shrink-0 truncate" ref={highlight(getNameRanges)}>
        {getName()}
      </span>
      <Switch>
        <Match when={getCounts() !== undefined}>
          <ChildCount
            count={getCounts()!.shown}
            hiddenCount={getCounts()!.hidden}
            isSelected={props.selectionState === 'selected'}
          />
        </Match>
        <Match when={getCounts() === undefined}>
          <span
            class="min-w-0 truncate font-mono text-xs text-gray-400"
            ref={highlight(getValueRanges)}
          >
            {getPreview(getValue(), getType())}
          </span>
        </Match>
      </Switch>
      <Show when={isPinned(getPath())}>
        <span
          role="img"
          aria-label="Pinned"
          title="Pinned"
          class="shrink-0 text-[11px] text-amber-400"
        >
          ★
        </span>
      </Show>
      <Show when={isRecentlyChanged(getPath())}>
        <ChangedDot />
      </Show>
    </div>
  );
}
