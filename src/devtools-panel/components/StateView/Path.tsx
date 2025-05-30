import { Index, Match, Show, Switch } from 'solid-js';
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
  chunks: PathChunk[];
}

export function Path(props: Props) {
  return (
    <Index each={props.chunks}>
      {(chunk, index) => (
        <>
          <Show when={index === 0}>
            <span class={colorClasses.pathRoot}>{chunk().name}</span>
          </Show>
          <Show when={chunk().selectedChildKey}>
            <Switch>
              <Match when={chunk().type === 'object'}>
                <span class={colorClasses.pathDot}>.</span>
                <span class={colorClasses.pathChunk}>{chunk().selectedChildKey!}</span>
              </Match>
              <Match when={chunk().type === 'array'}>
                <span class={colorClasses.pathBrackets}>[</span>
                <span class={colorClasses.typeNumber}>{chunk().selectedChildKey!}</span>
                <span class={colorClasses.pathBrackets}>]</span>
              </Match>
              <Match when={chunk().type === 'map'}>
                <span class={colorClasses.pathDot}>.</span>
                <span class={colorClasses.typeString}>get</span>
                <span class={colorClasses.pathBrackets}>{'("'}</span>
                <span class={colorClasses.typeNumber}>{chunk().selectedChildKey!}</span>
                <span class={colorClasses.pathBrackets}>{'")'}</span>
              </Match>
            </Switch>
          </Show>
        </>
      )}
    </Index>
  );
}
