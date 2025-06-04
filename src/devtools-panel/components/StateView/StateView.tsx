import { createEffect, Index } from 'solid-js';
import { NavLayers } from './types';
import { ObjectNav } from './ObjectNav';
import { ValueView } from './ValueView';
import { Path } from './Path';
import { Path as TPath, Value } from '@/shared/shared-types';

interface Props {
  navLayers: NavLayers;
  viewValue: Value;
  setPath: (newPath: TPath) => void;
  readonly?: boolean;
  setViewValue: (newValue: unknown) => void;
  setViewPropertyValue: (property: string | number, newValue: unknown) => void;
}

export function StateView(props: Props) {
  createEffect(() => {
    console.log('StateView > props.readonly', props.readonly);
  });
  return (
    <div class="flex h-full py-1">
      <Index each={props.navLayers.pathChunks}>
        {(chunk) => (
          <ObjectNav
            chunk={chunk()}
            onClick={(childKey) => props.setPath([...chunk().path, childKey])}
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
