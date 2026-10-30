import { getLatestState } from '@/devtools-panel/store/game-state';
import type { Path } from '@/shared/shared-types';

import { getNodeName } from '../../logic/get-node-name';
import { ValueHeader } from '../ValueHeader/ValueHeader';
import { ValueEditor } from './ValueEditor';
import { ValueTabs } from './ValueTabs';

interface Props {
  path: Path;
  onSelect: (path: Path) => void;
}

export function PrimitiveEditor(props: Props) {
  const getTitle = () => getNodeName(getLatestState(), props.path);

  return (
    <div class="flex flex-col gap-3 p-3">
      <ValueHeader path={props.path} />
      <ValueEditor path={props.path} label={getTitle()} />
      <ValueTabs path={props.path} onSelect={props.onSelect} />
    </div>
  );
}
