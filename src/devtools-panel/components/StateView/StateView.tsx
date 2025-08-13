import { Index } from 'solid-js';

import { getLockStatus } from '@/devtools-panel/utils/is-locked';
import { Path as TPath, Value } from '@/shared/shared-types';

import { ObjectNav } from './ObjectNav';
import { Path } from './Path';
import { NavLayers, PathChunk } from './types';
import { ValueView } from './ValueView';

function pathsMatch(path1: TPath, path2: TPath) {
  if (path1 === path2) return true;
  if (path1.length !== path2.length) return false;
  return path1.every((value, index) => value === path2[index]);
}

interface Props {
  navLayers: NavLayers;
  viewValue: Value;
  path: TPath;
  setPath: (newPath: TPath) => void;
  readonly?: boolean;
  setViewValue: (newValue: unknown) => void;
  setViewPropertyValue: (property: string | number, newValue: unknown) => void;
  onDeleteProperty: (path: TPath) => void;
  getLockedPaths: () => TPath[];
  addLockPath: (path: TPath) => void;
  removeLockPath: (path: TPath) => void;
}

export function StateView(props: Props) {
  const onPropertyClick = (chunk: PathChunk, property: string | number) => {
    const newPath = [...chunk.path, property];
    const isEqual = pathsMatch(props.path, newPath);
    props.setPath(isEqual ? chunk.path : newPath);
  };
  return (
    <div class="flex h-[calc(100%_-_3rem)] py-1">
      <Index each={props.navLayers.pathChunks}>
        {(chunk) => (
          <ObjectNav
            chunk={chunk()}
            selectedProperty={props.path[chunk().path.length]}
            onClick={(childKey) => onPropertyClick(chunk(), childKey)}
            onDeleteProperty={props.onDeleteProperty}
            addLockPath={props.addLockPath}
            removeLockPath={props.removeLockPath}
            getLockedPaths={props.getLockedPaths}
          />
        )}
      </Index>
      <ValueView
        value={props.viewValue}
        pathJsx={<Path chunks={props.navLayers.pathChunks} path={props.path} />}
        editable={!props.readonly}
        onChange={props.setViewValue}
        onPropertyChange={props.setViewPropertyValue}
        path={props.path}
        addLockPath={props.addLockPath}
        removeLockPath={props.removeLockPath}
        getLockedPaths={props.getLockedPaths}
      />
    </div>
  );
}
