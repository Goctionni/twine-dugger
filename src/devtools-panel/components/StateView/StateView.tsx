import { Index } from 'solid-js';
import { NavLayers, PathChunk } from './types';
import { ObjectNav } from './ObjectNav';
import { ValueView } from './ValueView';
import { Path } from './Path';
import { Path as TPath, Value } from '@/shared/shared-types';

interface Props {
  navLayers: NavLayers;
  viewValue: Value;
  path: TPath;
  setPath: (newPath: TPath) => void;
  readonly?: boolean;
  setViewValue: (newValue: unknown) => void;
  setViewPropertyValue: (property: string | number, newValue: unknown) => void;
}

export function StateView(props: Props) {
  const onPropertyClick = (chunk: PathChunk, property: string | number) => {
    const current = props.path[chunk.path.length];
    if (current === property) props.setPath(chunk.path);
    else props.setPath([...chunk.path, property]);
  };
  return (
    <div class="flex h-full py-1">
      <Index each={props.navLayers.pathChunks}>
        {(chunk, index) => (
          <ObjectNav
            chunk={chunk()}
            selectedProperty={props.path[chunk().path.length]}
            onClick={(childKey) => onPropertyClick(chunk(), childKey)}
          />
        )}
      </Index>
      <ValueView
        value={props.viewValue}
        path={<Path chunks={props.navLayers.pathChunks} />}
        editable={!props.readonly}
        onChange={props.setViewValue}
        onPropertyChange={props.setViewPropertyValue}
      />
    </div>
  );
}
