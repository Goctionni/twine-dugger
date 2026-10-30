import { createStablePath } from '@/devtools-panel/utils/create-stable-path';
import type { Path } from '@/shared/shared-types';

import { createNodeInfo } from '../Shared/create-node-info';
import { TileFrame, type TileSelectionState } from './TileFrame';
import { TileIcon } from './TileIcon';

interface Props {
  id: string;
  /** The container that holds the one the tiles show */
  path: Path;
  selectionState: TileSelectionState;
  onClick: () => void;
}

export function UpTile(props: Props) {
  const { getName } = createNodeInfo(createStablePath(() => props.path));

  return (
    <TileFrame
      id={props.id}
      selectionState={props.selectionState}
      title={`Up to ${getName()}`}
      onClick={props.onClick}
    >
      <TileIcon type="up" isContainer />
      <div class="line-clamp-2 max-w-full text-xs leading-tight break-words">{getName()}</div>
      <div class="font-mono text-[11px] text-gray-400">go up</div>
    </TileFrame>
  );
}
