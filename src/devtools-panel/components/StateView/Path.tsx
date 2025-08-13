import { Index, Match, Switch } from 'solid-js';

import { Path as TPath } from '@/shared/shared-types';

import { PathChunk } from './types';

const colorClasses = {
  pathRoot: 'text-sky-500',
  pathChunk: 'text-sky-400',
  pathDot: 'text-white',
  pathBrackets: 'text-yellow-300',
  typeNumber: 'text-emerald-300 saturate-50',
  typeString: 'text-orange-300 saturate-50',
  typeBoolean: 'text-blue-500',
  typeEmpty: 'text-gray-400',
  typeOther: 'text-red-200',
} as const;

interface Props {
  path: TPath;
  chunks: PathChunk[];
}

export function Path(props: Props) {
  return (
    <>
      <span class={colorClasses.pathRoot}>State</span>
      <Index each={props.path}>
        {(slug, index) => {
          const type = () => props.chunks[index]?.type;
          return (
            <Switch>
              <Match when={type() === 'object'}>
                <span class={colorClasses.pathDot}>.</span>
                <span class={colorClasses.pathChunk}>{slug()}</span>
              </Match>
              <Match when={type() === 'array'}>
                <span class={colorClasses.pathBrackets}>[</span>
                <span class={colorClasses.typeNumber}>{slug()}</span>
                <span class={colorClasses.pathBrackets}>]</span>
              </Match>
              <Match when={type() === 'map'}>
                <span class={colorClasses.pathDot}>.</span>
                <span class={colorClasses.typeString}>get</span>
                <span class={colorClasses.pathBrackets}>{'("'}</span>
                <span class={colorClasses.typeNumber}>{slug()}</span>
                <span class={colorClasses.pathBrackets}>{'")'}</span>
              </Match>
            </Switch>
          );
        }}
      </Index>
    </>
  );
}
