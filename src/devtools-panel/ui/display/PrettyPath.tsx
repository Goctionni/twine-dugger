import type { JSX } from '@solidjs/web';
import { Dynamic } from '@solidjs/web';
import { createMemo, For, Show } from 'solid-js';

import { getActiveState } from '@/devtools-panel/store/store';
import type { ContainerType } from '@/shared/json-safe';
import { getJsonType, getPathValue, isContainerType } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

const colorClasses = {
  pathRoot: 'text-sky-500',
  pathChunk: 'text-sky-400',
  pathDot: 'text-white',
  pathBrackets: 'text-yellow-300',
  typeNumber: 'text-emerald-300 saturate-50',
  typeString: 'text-orange-300 saturate-50',
  added: 'text-green-400!',
  removed: 'text-red-400!',
  glob: 'text-red-300',
} as const;

// Check if a property name needs bracket notation
function needsBracketNotation(propertyName: string | number): boolean {
  if (typeof propertyName === 'number') return false;

  // Valid JavaScript identifier regex
  const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  return !validIdentifier.test(propertyName);
}

interface Props {
  path: Path;
  /**
   * Container type of each ancestor (`kinds[i]` holds `path[i]`). Without it the types are looked
   * up in the active state, which only works for paths that exist in it.
   */
  kinds?: ContainerType[];
  statePrefix?: boolean;
  globSuffix?: boolean;
  action?: 'added' | 'removed';
  class?: string;
}

export function PrettyPath(props: Props) {
  const atoms = createMemo(() => {
    const lastIndex = props.path.length - 1;

    return props.path.flatMap((slug, index): AtomProps[] => {
      const parentType =
        props.kinds?.[index] ??
        getJsonType(getPathValue(getActiveState(), props.path.slice(0, index)));
      const leafClass = (index === lastIndex && props.action) || null;

      if (parentType === 'object') {
        if (props.statePrefix || index > 0) {
          if (needsBracketNotation(slug)) {
            // Use bracket notation for invalid identifiers
            return [
              { color: 'pathBrackets', text: '[' },
              { color: leafClass ?? 'typeString', text: `"${slug}"` },
              { color: 'pathBrackets', text: ']' },
            ];
          } else {
            // Use dot notation for valid identifiers
            return [
              { color: 'pathDot', text: '.' },
              { color: leafClass ?? 'pathChunk', text: slug },
            ];
          }
        }
        return [{ color: leafClass ?? 'pathRoot', text: slug }];
      }
      if (parentType === 'array' || parentType === 'set') {
        // The first item of a Set's array is its marker
        const text = parentType === 'set' && typeof slug === 'number' ? slug - 1 : slug;
        return [
          { color: 'pathBrackets', text: '[' },
          { color: leafClass ?? 'typeNumber', text },
          { color: 'pathBrackets', text: ']' },
        ];
      }
      if (parentType === 'map') {
        const keyNode: AtomProps =
          typeof slug === 'string'
            ? { color: leafClass ?? 'typeString', text: `"${slug}"` }
            : { color: leafClass ?? 'typeNumber', text: slug };

        return [
          { color: 'pathDot', text: '.' },
          { color: 'typeString', text: 'get' },
          { color: 'pathBrackets', text: '(' },
          keyNode,
          { color: 'pathBrackets', text: ')' },
        ];
      }
      return [];
    });
  });

  const isContainer = () =>
    isContainerType(getJsonType(getPathValue(getActiveState(), props.path)));

  return (
    <Dynamic
      component={props.class ? 'span' : (p: { children: JSX.Element }) => p.children}
      class={props.class}
    >
      <Show when={props.statePrefix}>
        <span class={colorClasses.pathRoot}>State</span>
      </Show>
      <For each={atoms()} keyed={false}>
        {(atom) => <PathAtom {...atom()} />}
      </For>
      <Show when={props.globSuffix && isContainer()}>
        <span class={colorClasses.pathDot}>.</span>
        <span class={colorClasses.glob}>*</span>
      </Show>
    </Dynamic>
  );
}

interface AtomProps {
  text: string | number;
  color: keyof typeof colorClasses;
}
function PathAtom(props: AtomProps) {
  return <span class={colorClasses[props.color]}>{props.text}</span>;
}
