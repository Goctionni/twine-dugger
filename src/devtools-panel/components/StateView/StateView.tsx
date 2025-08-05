import { Index, onMount, onCleanup, createSignal, createMemo } from 'solid-js';
import { NavLayers, PathChunk } from './types';
import { ObjectNav } from './ObjectNav';
import { ValueView } from './ValueView';
import { Path } from './Path';
import { Path as TPath, Value } from '@/shared/shared-types';
import { useContextMenu } from '@/devtools-panel/components/ContextMenuProvider/ContextMenu';

function pathsMatch(path1: TPath, path2: TPath): boolean {
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
  deleteViewPropertyValue: (property: string | number) => void;
}

export function StateView(props: Props) {
  const { registerContextHandler } = useContextMenu();
  let containerRef!: HTMLDivElement;

  const [rightClickedProperty, setRightClickedProperty] = createSignal<string | null>(null);

  // Context Menu Registration
  onMount(() => {
    const unregister = registerContextHandler((e) => {
      if (!containerRef.contains(e.target as Node)) return null;

      const target = e.target as HTMLElement;
      const property = target.closest('[data-property]')?.getAttribute('data-property');
      setRightClickedProperty(property ?? null);

      if (property) {
        return [{
          label: `Delete "${property}"`,
          onClick: () => props.deleteViewPropertyValue(property),
        }];
      }
      return [];
    });

    onCleanup(() => unregister());
  });

  const handlePropertyClick = (chunk: PathChunk, property: string | number) => {
    const newPath = [...chunk.path, property];
    const isSame = pathsMatch(props.path, newPath);
    props.setPath(isSame ? chunk.path : newPath);
  };

  const selectedProperties = createMemo(() =>
    props.navLayers.pathChunks.map((chunk) => props.path[chunk.path.length])
  );

  return (
    <div ref={containerRef} class="flex h-full py-1">
      <Index each={props.navLayers.pathChunks}>
        {(chunk, idx) => (
          <ObjectNav
            chunk={chunk()}
            selectedProperty={selectedProperties()[idx]}
            onClick={handlePropertyClick.bind(null, chunk())}
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