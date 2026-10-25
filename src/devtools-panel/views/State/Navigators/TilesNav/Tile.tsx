import { Match, Show, Switch } from 'solid-js';

import { isPinned } from '@/devtools-panel/store/store';
import { highlight } from '@/devtools-panel/ui/display/HighlightDirective';
import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import type { Path } from '@/shared/shared-types';

import { createPathMenu } from '../../PathMenu/create-path-menu';
import { ChangedDot } from '../Shared/ChangedDot';
import { getChildCountTitle } from '../Shared/ChildCount';
import { createNodeInfo } from '../Shared/create-node-info';
import { getPreview } from '../Shared/preview';
import { isRecentlyChanged } from '../Shared/recently-changed';
import { PinMark } from './PinMark';
import { TileFrame, type TileSelectionState } from './TileFrame';
import { TileIcon } from './TileIcon';

interface Props {
  id: string;
  path: Path;
  selectionState: TileSelectionState;
  onSelect: () => void;
  onOpen: () => void;
}

export function Tile(props: Props) {
  const getPath = createStablePath(() => props.path);
  const { getValue, getType, getName, getCounts, getNameRanges, getValueRanges } =
    createNodeInfo(getPath);

  // An array and a set hold items, the others entries
  const getCountText = (count: number) => {
    const [one, other] =
      getType() === 'array' || getType() === 'set' ? ['item', 'items'] : ['entry', 'entries'];
    return `${count} ${count === 1 ? one : other}`;
  };

  return (
    <TileFrame
      id={props.id}
      selectionState={props.selectionState}
      onClick={() => (getCounts() === undefined ? props.onSelect() : props.onOpen())}
      onContextMenu={createPathMenu(getPath)}
    >
      <TileIcon type={getType()} isContainer={getCounts() !== undefined}>
        <Show when={isPinned(getPath())}>
          <PinMark />
        </Show>
      </TileIcon>
      <div
        class="line-clamp-2 max-w-full text-xs leading-tight break-words"
        ref={highlight(getNameRanges)}
      >
        {getName()}
      </div>
      <div
        class="max-w-full truncate font-mono text-[11px] text-gray-400"
        ref={highlight(getValueRanges)}
      >
        <Show when={isRecentlyChanged(getPath())}>
          <ChangedDot class="mr-1 inline-block align-middle" />
        </Show>
        <Switch>
          <Match when={getCounts() !== undefined}>
            <span
              class={getCounts()!.hidden > 0 ? 'text-amber-400' : undefined}
              title={getChildCountTitle(getCounts()!.shown, getCounts()!.hidden)}
            >
              {getCountText(getCounts()!.shown)}
            </span>
          </Match>
          <Match when={getCounts() === undefined}>{getPreview(getValue(), getType())}</Match>
        </Switch>
      </div>
    </TileFrame>
  );
}
