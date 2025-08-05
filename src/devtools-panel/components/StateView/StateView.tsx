import { Index, onMount, onCleanup, createSignal } from 'solid-js';
import { NavLayers, PathChunk } from './types';
import { ObjectNav } from './ObjectNav';
import { ValueView } from './ValueView';
import { Path } from './Path';
import { Path as TPath, Value } from '@/shared/shared-types';
import { useContextMenu } from '@/devtools-panel/components/ContextMenuProvider/ContextMenu';

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
}

export function StateView(props: Props) {
  const { registerContextHandler } = useContextMenu();
  let containerRef: HTMLDivElement | undefined;
  const [rightClickedProperty, setRightClickedProperty] = createSignal<string | null>(null);

  const onPropertyClick = (chunk: PathChunk, property: string | number) => {
    const newPath = [...chunk.path, property];
    const isEqual = pathsMatch(props.path, newPath);
    props.setPath(isEqual ? chunk.path : newPath);
  };

  onMount(() => {
    const unregister = registerContextHandler((e) => {
      if (!containerRef?.contains(e.target as Node)) return null;

      const target = e.target as HTMLElement;
      const property = target.closest('[data-property]')?.getAttribute('data-property');
      setRightClickedProperty(property ?? null);

      const menuItems = [];

      if (property) {
        menuItems.push({
          label: `Delete "${property}"`,
          onClick: () => console.log('Delete', property),
        });
      }

      menuItems.push({
        label: 'StateView Option',
        onClick: () => console.log('StateView clicked'),
      });

      return menuItems;
    });

    onCleanup(() => unregister());
  });

  return (
    <div ref={containerRef} class="flex h-full py-1">
      <Index each={props.navLayers.pathChunks}>
        {(chunk) => (
          <ObjectNav
            chunk={chunk()}
            selectedProperty={props.path[chunk().path.length]}
            onClick={(childKey) => onPropertyClick(chunk(), childKey)}
            dataPropertyPath={chunk().path}
          />
        )}
      </Index>
      <ValueView
        value={props.viewValue}
        path={<Path chunks={props.navLayers.pathChunks} path={props.path} />}
        editable={!props.readonly}
        onChange={props.setViewValue}
        onPropertyChange={props.setViewPropertyValue}
      />
    </div>
  );
}
