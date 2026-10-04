import { createEffect, createMemo, Show, untrack } from 'solid-js';

import { getActiveState } from '@/devtools-panel/store/game-state';
import type { ContainerType } from '@/shared/json-safe';
import {
  getJsonType,
  getKeyLabel,
  getPathValue,
  isContainerType,
  isNumberLike,
  isNumberMapValue,
} from '@/shared/json-safe';
import type { JSONSafeValue, Path } from '@/shared/shared-types';

import { highlightRanges, type CharRange } from '../util/range-highlight';

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

function getParentType(parent: JSONSafeValue, slug: string | number): ContainerType {
  const type = getJsonType(parent);
  if (isContainerType(type)) return type;
  return typeof slug === 'number' ? 'array' : 'object';
}

interface AtomProps {
  text: string | number;
  color: keyof typeof colorClasses;
}

interface AtomOptions {
  statePrefix?: boolean;
  action?: 'added' | 'removed';
}

/** How a path is written, as pieces with a color. Walks down the state once, looking at each parent */
function getAtoms(path: Path, state: JSONSafeValue, { statePrefix, action }: AtomOptions) {
  const lastIndex = path.length - 1;
  const atoms: AtomProps[] = [];
  let parent = state;

  path.forEach((slug, index) => {
    const parentType = getParentType(parent, slug);
    const leafClass = (index === lastIndex && action) || null;

    if (parentType === 'object') {
      if (statePrefix || index > 0) {
        if (needsBracketNotation(slug)) {
          // Use bracket notation for invalid identifiers
          atoms.push(
            { color: 'pathBrackets', text: '[' },
            { color: leafClass ?? 'typeString', text: `"${slug}"` },
            { color: 'pathBrackets', text: ']' },
          );
        } else {
          // Use dot notation for valid identifiers
          atoms.push(
            { color: 'pathDot', text: '.' },
            { color: leafClass ?? 'pathChunk', text: slug },
          );
        }
      } else {
        atoms.push({ color: leafClass ?? 'pathRoot', text: slug });
      }
    } else if (parentType === 'array' || parentType === 'set') {
      atoms.push(
        { color: 'pathBrackets', text: '[' },
        { color: leafClass ?? 'typeNumber', text: getKeyLabel(parentType, slug) },
        { color: 'pathBrackets', text: ']' },
      );
    } else {
      const keyNode: AtomProps =
        typeof slug === 'string' && !(isNumberMapValue(parent) && isNumberLike(slug))
          ? { color: leafClass ?? 'typeString', text: `"${slug}"` }
          : { color: leafClass ?? 'typeNumber', text: slug };
      atoms.push(
        { color: 'pathDot', text: '.' },
        { color: 'typeString', text: 'get' },
        { color: 'pathBrackets', text: '(' },
        keyNode,
        { color: 'pathBrackets', text: ')' },
      );
    }

    parent =
      parent !== null && typeof parent === 'object'
        ? (parent as Record<string | number, JSONSafeValue>)[slug]
        : undefined;
  });
  return atoms;
}

interface Props {
  path: Path;
  statePrefix?: boolean;
  globSuffix?: boolean;
  action?: 'added' | 'removed';
  class?: string;
  /** Parts of the written path to mark as a search match, as positions in its text */
  ranges?: readonly CharRange[];
}

export function PrettyPath(props: Props) {
  // How it is shown (the prefix, the suffix, the wrapper) is decided when it is made: nothing
  // changes these on a path that is on the page, and a scope for each would cost more than it saves
  const { statePrefix, globSuffix, className, canHighlight } = untrack(() => ({
    statePrefix: props.statePrefix,
    globSuffix: props.globSuffix,
    className: props.class,
    canHighlight: props.ranges !== undefined,
  }));

  // A path is about the state as it was when the path was made, so how it's written is worked out
  // once. If a Map is removed later, its keys are still written as the keys of a Map.
  //
  // The pieces never change on their own, so they are plain elements made in one go: a component
  // and a scope for each piece would cost more than the pieces are worth, and there can be hundreds
  // of paths on the page.
  const pieces = createMemo(() => {
    const path = [...props.path];
    return untrack(() =>
      getAtoms(path, getActiveState(), props).map((atom) => (
        <span class={colorClasses[atom.color]}>{atom.text}</span>
      )),
    );
  });

  const isContainer = () =>
    untrack(() => isContainerType(getJsonType(getPathValue(getActiveState(), props.path))));

  const content = (
    <>
      {statePrefix && <span class={colorClasses.pathRoot}>State</span>}
      {pieces()}
      {globSuffix && (
        <Show when={isContainer()}>
          <span class={colorClasses.pathDot}>.</span>
          <span class={colorClasses.glob}>*</span>
        </Show>
      )}
    </>
  );

  // The wrapper is decided once, like the rest (see above)
  // oxlint-disable-next-line solid/components-return-once
  if (!className && !canHighlight) return content;

  // Marking text needs an element to look for the text in
  let wrapper: HTMLSpanElement | undefined;
  createEffect(
    () => ({
      pieces: pieces(),
      ranges: props.ranges?.map(([start, end]) => [start, end] as const),
    }),
    ({ ranges }) => (wrapper && ranges ? highlightRanges(wrapper, ranges) : undefined),
  );

  return (
    <span class={className} ref={wrapper}>
      {content}
    </span>
  );
}
