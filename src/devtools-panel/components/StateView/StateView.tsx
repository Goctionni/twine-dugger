import { Accessor, Index } from 'solid-js';
import { PathChunk, SelectedValue } from './types';
import { ObjectNav } from './ObjectNav';
import { ValueView } from './ValueView';
import { Path } from './Path';
import { Value } from '@/shared/shared-types';

interface Props {
  getPathChunks: Accessor<PathChunk[]>;
  getSelectedValue: () => SelectedValue;
  setSelectedValue: (newValue: Value) => void;
  selectPath: (parentChunk: PathChunk, selectedChildKey: string | number) => void;
}

export function StateView(props: Props) {
  return (
    <div class="flex h-full px-2 py-1">
      <Index each={props.getPathChunks()}>
        {(chunk) => (
          <ObjectNav chunk={chunk()} onClick={(childKey) => props.selectPath(chunk(), childKey)} />
        )}
      </Index>
      <ValueView
        selectedValue={props.getSelectedValue()}
        path={<Path chunks={props.getPathChunks()} />}
        editable
        onChange={
          props.setSelectedValue as (newValue: unknown, keyOrIndex?: string | number) => void
        }
      />
    </div>
  );
}
