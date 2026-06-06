import type { JSX } from 'solid-js';
import { createMemo, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { getActiveState } from '@/devtools-panel/store';
import { getObjectPathValue } from '@/shared/get-object-path-value';
import type { Path } from '@/shared/shared-types';
import { getSpecificType } from '@/shared/type-helpers';

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
  statePrefix?: boolean;
  globSuffix?: boolean;
  action?: 'added' | 'removed';
  class?: string;
}

export function PrettyPath(props: Props) {
  const chunks = createMemo(() => {
    const state = getActiveState()!;
    const lastIndex = props.path.length - 1;

    return props.path
      .flatMap((slug, index): Array<false | AtomProps> => {
        const partialPath = props.path.slice(0, index + 1);
        const parentValue = getObjectPathValue(state, partialPath.slice(0, -1));
        const parentType = getSpecificType(parentValue);
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
        if (parentType === 'array') {
          return [
            { color: 'pathBrackets', text: '[' },
            { color: leafClass ?? 'typeNumber', text: slug },
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
      })
      .filter((v): v is AtomProps => !!v)
      .map((atomProps) => <PathAtom {...atomProps} />);
  });

  const isObjectValue = () => {
    const state = getActiveState()!;
    const value = getObjectPathValue(state, props.path);
    return !!value && typeof value === 'object';
  };

  return (
    <Dynamic
      component={props.class ? 'span' : (p: { children: JSX.Element }) => p.children}
      class={props.class}
    >
      <Show when={props.statePrefix}>
        <span class={colorClasses.pathRoot}>State</span>
      </Show>
      {chunks()}
      <Show when={props.globSuffix && isObjectValue()}>
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
