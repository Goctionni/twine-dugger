import { Index, onMount, onCleanup, createSignal, createMemo, createEffect } from 'solid-js';
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

function getNestedValue(obj: unknown, path: (string | number)[]): any {
  return path.reduce((acc, key) => (acc && typeof acc === 'object' ? (acc as any)[key] : undefined), obj);
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
  const [duplicatingProperty, setDuplicatingProperty] = createSignal<string | null>(null);
  const [duplicateName, setDuplicateName] = createSignal<string>('');
  const [lockedProperties, setLockedProperties] = createSignal<Map<string, unknown>>(new Map());

  const toggleLockProperty = (property: string | number) => {
    const key = String(property);
    setLockedProperties(prev => {
      const newMap = new Map(prev);
      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        const value = (props.viewValue as Record<string | number, unknown>)[property];
        newMap.set(key, structuredClone(value));
      }
      return newMap;
    });
  };

  createEffect(() => {
    const current = props.viewValue as Record<string | number, unknown>;
    const locked = lockedProperties();

    locked.forEach((lockedValue, property) => {
      const actualProp = property in current ? property : Number(property);
      if (!(actualProp in current)) return;

      const currentValue = current[actualProp];
      if (JSON.stringify(currentValue) !== JSON.stringify(lockedValue)) {
        // Revert the change immediately, I am unsure if we want to prevent or revert?
        props.setViewPropertyValue(actualProp, structuredClone(lockedValue));
      }
    });
  });

  // Context Menu Registration
  onMount(() => {
    const unregister = registerContextHandler((e) => {
      if (!containerRef.contains(e.target as Node)) return null;

      const target = e.target as HTMLElement;
      const property = target.closest('[data-property]')?.getAttribute('data-property');
      setRightClickedProperty(property ?? null);

      if (property) {
        return [
          {
            label: `Delete "${property}"`,
            onClick: () => props.deleteViewPropertyValue(property),
          },
          {
            label: `Duplicate "${property}"`,
            onClick: () => {
              setDuplicatingProperty(property);
              setDuplicateName(`${property}_copy`);
            },
          },
          {
            label: lockedProperties().has(String(property)) ? `Unlock "${property}"` : `Lock "${property}"`,
            onClick: () => toggleLockProperty(property),
          }
        ];
      }
      return [];
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.contains(e.target as Node)) {
        setDuplicatingProperty(null);
        setDuplicateName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    onCleanup(() => {
      unregister();
      document.removeEventListener('mousedown', handleClickOutside);
    });
  });


  const handleDuplicateSave = () => {
    const sourceProp = duplicatingProperty();
    const newProp = duplicateName();

    if (!sourceProp || !newProp) return;

    const sourceValue = (props.viewValue as Record<string, unknown>)[sourceProp];
    const clonedValue = structuredClone(sourceValue);

    props.setViewPropertyValue(newProp, clonedValue);

    setDuplicatingProperty(null);
    setDuplicateName('');
  };

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
            duplicatingProperty={duplicatingProperty()}
            duplicateName={duplicateName()}
            setDuplicateName={setDuplicateName}
            onDuplicateSave={handleDuplicateSave}
            lockedProperties={lockedProperties}
            onAddProperty={(key, value) => {
              const path = chunk().path;
              const target = getNestedValue(props.viewValue, path);
              if (typeof target === 'object' && target !== null) {
                target[key] = value;
                props.setViewValue(structuredClone(props.viewValue));
              }
            }}
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