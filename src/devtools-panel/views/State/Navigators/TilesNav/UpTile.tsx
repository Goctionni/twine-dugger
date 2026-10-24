import { TileFrame, type TileSelectionState } from './TileFrame';
import { TileIcon } from './TileIcon';

interface Props {
  /** The name of the container that holds the one the tiles show */
  name: string;
  selectionState: TileSelectionState;
  onClick: () => void;
}

export function UpTile(props: Props) {
  return (
    <TileFrame
      selectionState={props.selectionState}
      title={`Up to ${props.name}`}
      onClick={props.onClick}
    >
      <TileIcon type="up" isContainer />
      <div class="line-clamp-2 max-w-full text-xs leading-tight break-words">{props.name}</div>
      <div class="font-mono text-[11px] text-gray-400">go up</div>
    </TileFrame>
  );
}
