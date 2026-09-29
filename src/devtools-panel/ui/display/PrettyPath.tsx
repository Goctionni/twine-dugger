import type { JSX } from '@solidjs/web';
import { Dynamic } from '@solidjs/web';
import { createMemo, For, Show, untrack } from 'solid-js';

import { getActiveState } from '@/devtools-panel/store/game-state';
import type { ContainerType } from '@/shared/json-safe';
import { getJsonType, getKeyLabel, getPathValue, isContainerType } from '@/shared/json-safe';
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

/**
 * What holds `path[index]` in the state, which decides how it's written. A path that isn't in the
 * state (anymore) is written the way its segments suggest.
 */
function getParentType(state: unknown, path: Path, index: number): ContainerType {
  const type = getJsonType(getPathValue(state, path.slice(0, index)));
  if (isContainerType(type)) return type;
  return typeof path[index] === 'number' ? 'array' : 'object';
}

interface Props {
  path: Path;
  statePrefix?: boolean;
  globSuffix?: boolean;
  action?: 'added' | 'removed';
  class?: string;
}

export function PrettyPath(props: Props) {
  const atoms = createMemo(() => {
    const path = [...props.path];
    const lastIndex = path.length - 1;

    // A path is about the state as it was when the path was made, so how it's written is worked out
    // once. If a Map is removed later, its keys are still written as the keys of a Map.
    return untrack(() => {
      const state = getActiveState();
      return path.flatMap((slug, index): AtomProps[] => {
        const parentType = getParentType(state, path, index);
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
          return [
            { color: 'pathBrackets', text: '[' },
            { color: leafClass ?? 'typeNumber', text: getKeyLabel(parentType, slug) },
            { color: 'pathBrackets', text: ']' },
          ];
        }
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
      });
    });
  });

  const isContainer = () =>
    untrack(() => isContainerType(getJsonType(getPathValue(getActiveState(), props.path))));

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
